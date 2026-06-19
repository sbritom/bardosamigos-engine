import { PALPITE_STATUS } from '../constants'
import { createPalpite } from '../domain/palpite'
import { validatePalpite } from '../validators/palpiteValidators'

export function createPalpiteService(options = {}) {
  const repository = options.repository

  return {
    criarPalpite({ jogo, usuario, placar, metadata = {}, agora = new Date() } = {}) {
      const palpite = createPalpite({
        jogoId: jogo?.id,
        usuarioId: usuario?.id || usuario?.usuarioId,
        placar,
        metadata,
      })
      const palpites = repository?.list('palpites', (item) => item.jogoId === jogo?.id) || []
      const validation = validatePalpite({ palpite, jogo, usuario, palpites, agora })

      if (!validation.valido) {
        return {
          ok: false,
          palpite: {
            ...palpite,
            status: PALPITE_STATUS.BLOQUEADO,
          },
          erros: validation.erros,
        }
      }

      const savedPalpite = repository?.save('palpites', palpite) || palpite

      return {
        ok: true,
        palpite: savedPalpite,
        erros: [],
      }
    },

    listarPorJogo(jogoId) {
      return repository?.list('palpites', (palpite) => palpite.jogoId === jogoId) || []
    },

    listarPorUsuario(usuarioId) {
      return repository?.list('palpites', (palpite) => palpite.usuarioId === usuarioId) || []
    },
  }
}
