import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

import { AutoDJEngine } from "../autodj/AutoDJEngine.js";
import { AudioQueue } from "../audio/AudioQueue.js";
import { PlaylistEngine } from "../library/PlaylistEngine.js";
import { StreamEngine } from "../stream/StreamEngine.js";

const logger = {
  info() {},
  warn() {},
  error() {},
};

function track(id, artist = `Artist ${id}`, genre = `Genre ${id}`) {
  return {
    id,
    title: `Track ${id}`,
    artist,
    genre,
    path: `/music/${id}.mp3`,
  };
}

function createAutoDJ(tracks, config = {}) {
  const playlist = new PlaylistEngine({ getTracks: () => tracks }, { shuffle: false, ...config });
  playlist.init();
  const autodj = new AutoDJEngine(playlist, logger);
  autodj.init();
  return { autodj, playlist };
}

function createRealisticLibrary() {
  return [
    track("ze-ruela", "Banda Amor Secreto", "Piseiro"),
    track("ze-ruela-live", "Banda Amor Secreto", "Piseiro"),
    track("ze-ruela-remix", "Banda Amor Secreto", "Piseiro"),
    track("projota-muleque", "Projota", "Rap"),
    track("projota-acustico", "Projota", "Rap"),
    track("pagode-01", "Grupo Mesa 1", "Pagode"),
    track("pagode-02", "Grupo Mesa 1", "Pagode"),
    track("sertanejo-01", "Dupla Bar", "Sertanejo"),
    track("sertanejo-02", "Dupla Bar", "Sertanejo"),
    track("rock-01", "Banda Garagem", "Rock"),
    track("rock-02", "Banda Garagem", "Rock"),
    track("pop-01", "Cantora Neon", "Pop"),
    track("pop-02", "Cantora Neon", "Pop"),
    track("rap-02", "MC Avenida", "Rap"),
    track("piseiro-02", "Forro da Casa", "Piseiro"),
    track("samba-01", "Roda Livre", "Samba"),
  ];
}

function createObservedBarLibrary() {
  return [
    track("ze-ruela", "PENDRIVE SUPER ATUALIZADO JULHO26", "CD AS TOP DE JULHO FERIAS 2026"),
    track("natanzinho", "PENDRIVE SUPER ATUALIZADO JULHO26", "CD AS TOP DE JULHO FERIAS 2026"),
    track("maria-vaqueiro", "PENDRIVE SUPER ATUALIZADO JULHO26", "CD AS TOP DE JULHO FERIAS 2026"),
    track("isso-e-amor", "PENDRIVE SUPER ATUALIZADO JULHO26", "CD AS TOP DE JULHO FERIAS 2026"),
    track("dom-dom-dom", "PENDRIVE SUPER ATUALIZADO JULHO26", "CD AS TOP DE JULHO FERIAS 2026"),
    track("lembrancas", "PENDRIVE SUPER ATUALIZADO JULHO26", "CD AS TOP DE JULHO FERIAS 2026"),
    track("feat-leonardo", "PENDRIVE SUPER ATUALIZADO JULHO26", "CD AS TOP DE JULHO FERIAS 2026"),
    track("dom-dom-dom-rei", "PENDRIVE SUPER ATUALIZADO JULHO26", "CD AS TOP DE JULHO FERIAS 2026"),
    track("boyzinho", "PENDRIVE SUPER ATUALIZADO JULHO26", "CD AS TOP DE JULHO FERIAS 2026"),
    track("marcia-fellipe", "PENDRIVE SUPER ATUALIZADO JULHO26", "CD AS TOP DE JULHO FERIAS 2026"),
    track("ce-topa", "PENDRIVE SUPER ATUALIZADO REPJULHO26", "CD AS TOP DE JULHO FERIAS 2026"),
    track("calafrio", "PENDRIVE SUPER ATUALIZADO JULHO26", "CD AS TOP DE JULHO FERIAS 2026"),
    track("quem-manda", "PENDRIVE SUPER ATUALIZADO JULHO26", "CD AS TOP DE JULHO FERIAS 2026"),
    track("flor-jasmim", "PENDRIVE SUPER ATUALIZADO JULHO26", "CD AS TOP DE JULHO FERIAS 2026"),
    track("maria-vaqueira", "PENDRIVE SUPER ATUALIZADO JULHO26", "CD AS TOP DE JULHO FERIAS 2026"),
    track("projota", "Artista nao identificado", "music"),
  ];
}

async function runStreamFlow(tracks, iterations = tracks.length) {
  const { autodj, playlist } = createAutoDJ(tracks);
  const audioQueue = new AudioQueue();
  const played = [];
  const stream = new StreamEngine({
    audioQueue,
    autodj,
    logger,
    eventBus: { emit() {} },
    history: null,
    nowPlaying: null,
    audioPipeline: {
      play: async (selected) => {
        played.push(selected.id);
      },
      stop() {},
    },
  });

  for (let index = 0; index < iterations; index += 1) {
    await stream.playNextTrack();
  }

  return { played, playlist };
}

export async function runAutoDJTests() {
  {
    const tracks = Array.from({ length: 16 }, (_, index) => track(`track-${index + 1}`));
    const { autodj } = createAutoDJ(tracks);
    const played = Array.from({ length: 16 }, () => autodj.selectNext({ consume: true })?.id);
    assert.equal(new Set(played).size, 16, "AutoDJ percorre 16 musicas antes de repetir");
  }

  {
    const tracks = createRealisticLibrary();
    const { played, playlist } = await runStreamFlow(tracks, 16);
    assert.equal(played.length, 16, "Fluxo real do StreamEngine tocou 16 selecoes");
    assert.equal(new Set(played).size, 16, "Fluxo real nao repete antes de tocar as 16 musicas");
    assert.deepEqual(played, [
      "ze-ruela",
      "projota-muleque",
      "pagode-01",
      "sertanejo-01",
      "rock-01",
      "pop-01",
      "rap-02",
      "piseiro-02",
      "samba-01",
      "ze-ruela-live",
      "projota-acustico",
      "pagode-02",
      "sertanejo-02",
      "rock-02",
      "pop-02",
      "ze-ruela-remix",
    ], "Sequencia real cobre as 16 faixas antes de repetir");
    assert.equal(playlist.history().length, 16, "Playlist confirmou indice em cada consumo do preload");
  }

  {
    const tracks = createObservedBarLibrary();
    const { played, playlist } = await runStreamFlow(tracks, 16);
    assert.deepEqual(played, [
      "ze-ruela",
      "projota",
      "natanzinho",
      "ce-topa",
      "calafrio",
      "quem-manda",
      "flor-jasmim",
      "maria-vaqueira",
      "maria-vaqueiro",
      "isso-e-amor",
      "dom-dom-dom",
      "lembrancas",
      "feat-leonardo",
      "dom-dom-dom-rei",
      "boyzinho",
      "marcia-fellipe",
    ], "Fluxo real da biblioteca observada nao alterna entre duas musicas");
    assert.equal(new Set(played).size, 16, "Biblioteca observada toca 16 musicas unicas antes de repetir");
    assert.equal(playlist.index, 9, "Indice termina na ultima faixa confirmada pelo preload");
  }

  {
    const { autodj } = createAutoDJ([track("a"), track("b"), track("c")]);
    const played = Array.from({ length: 8 }, () => autodj.selectNext({ consume: true })?.id);
    played.slice(1).forEach((id, index) => {
      assert.notEqual(id, played[index], "A mesma musica nao toca duas vezes seguidas");
    });
  }

  {
    const tracks = [track("a1", "Artist A", "Rock"), track("a2", "Artist A", "Pop"), track("b1", "Artist B", "Soul")];
    const { autodj } = createAutoDJ(tracks);
    assert.equal(autodj.selectNext({ consume: true })?.id, "a1");
    assert.equal(autodj.selectNext({ consume: true })?.id, "b1", "AutoDJ evita mesmo artista quando existe alternativa");
  }

  {
    const tracks = [track("r1", "Artist A", "Rock"), track("r2", "Artist B", "Rock"), track("p1", "Artist C", "Pop")];
    const { autodj } = createAutoDJ(tracks);
    assert.equal(autodj.selectNext({ consume: true })?.id, "r1");
    assert.equal(autodj.selectNext({ consume: true })?.id, "p1", "AutoDJ evita mesmo genero quando existe alternativa");
  }

  {
    const tracks = [track("a1", "Artist A", "Rock"), track("a2", "Artist A", "Rock")];
    const { autodj } = createAutoDJ(tracks);
    assert.equal(autodj.selectNext({ consume: true })?.id, "a1");
    assert.equal(autodj.selectNext({ consume: true })?.id, "a2", "AutoDJ relaxa restricoes quando nao existem alternativas");
  }

  {
    const { autodj } = createAutoDJ([track("a"), track("b")]);
    const played = Array.from({ length: 5 }, () => autodj.selectNext({ consume: true })?.id);
    assert.deepEqual(played, ["a", "b", "a", "b", "a"], "AutoDJ continua apos o fim da playlist");
  }

  {
    const { autodj, playlist } = createAutoDJ([track("a"), track("b"), track("c")]);
    playlist.addToQueue(track("manual", "Manual Artist", "Manual Genre"), 100);
    assert.equal(autodj.selectNext({ consume: true })?.id, "manual", "Fila manual tem prioridade");
  }

  {
    const tracks = [track("a"), track("b"), track("c")];
    const { autodj, playlist } = createAutoDJ(tracks);
    playlist.addToQueue(tracks[2], 100);
    assert.equal(autodj.selectNext({ consume: true })?.id, "c");
    assert.equal(playlist.queueList().length, 0, "Musica da fila manual e consumida uma vez");
    assert.equal(autodj.selectNext({ consume: true })?.id, "a", "Fila manual nao fica presa como primeira opcao");
  }

  {
    const tracks = [track("a"), track("b"), track("c")];
    const { autodj } = createAutoDJ(tracks);
    const audioQueue = new AudioQueue();
    const first = autodj.selectNext({ consume: true });
    const preloaded = autodj.selectNext({ consume: false });
    audioQueue.preload(preloaded);
    const consumedPreload = audioQueue.next();
    autodj.commitSelection(consumedPreload);
    const third = autodj.selectNext({ consume: true });
    assert.equal(first.id, "a");
    assert.equal(preloaded.id, "b");
    assert.equal(consumedPreload.id, "b");
    assert.equal(third.id, "c", "Preload nao repete nem salta a playlist");
  }

  {
    const { autodj } = createAutoDJ([]);
    assert.equal(autodj.selectNext({ consume: true }), null, "Biblioteca vazia retorna null");
  }

  {
    const { autodj } = createAutoDJ([track("single")]);
    assert.equal(autodj.selectNext({ consume: true })?.id, "single");
    assert.equal(autodj.selectNext({ consume: true })?.id, "single", "Biblioteca com uma musica continua funcionando");
  }

  {
    const initial = [track("a"), track("b"), track("c")];
    const updated = [...initial, track("d")];
    const { autodj, playlist } = createAutoDJ(initial);
    autodj.selectNext({ consume: true });
    const current = autodj.selectNext({ consume: true });
    playlist.reload(updated, { currentTrack: current });
    const played = Array.from({ length: 4 }, () => autodj.selectNext({ consume: true })?.id);
    assert.ok(played.includes("d"), "Sincronizacao da biblioteca disponibiliza novas musicas");
    assert.notEqual(playlist.index, -1, "Sincronizacao preserva estado de reproducao");
  }

  console.info("OK Testes do AutoDJ passaram");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runAutoDJTests().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
