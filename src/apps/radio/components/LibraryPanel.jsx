import { memo } from "react";
import { Library } from "lucide-react";

import { formatCount } from "../radioFormatters";

function LibraryPanel({ health }) {
  const library = health?.library || health?.modules?.library || health?.stats?.library || {};
  const tracks = library.tracks || library.librarySize || library.totalTracks || 0;
  const artists = library.artists || library.totalArtists || 0;
  const albums = library.albums || library.totalAlbums || 0;
  const genres = library.genres || library.totalGenres || 0;

  return (
    <section className="bar-radio-card">
      <div className="bar-radio-card-title">
        <Library size={18} />
        <h3>Biblioteca</h3>
      </div>
      <div className="bar-radio-stats-grid">
        <span>{formatCount(tracks, "musica", "musicas")}</span>
        <span>{formatCount(artists, "artista", "artistas")}</span>
        <span>{formatCount(albums, "album", "albuns")}</span>
        <span>{formatCount(genres, "genero", "generos")}</span>
      </div>
    </section>
  );
}

export default memo(LibraryPanel);
