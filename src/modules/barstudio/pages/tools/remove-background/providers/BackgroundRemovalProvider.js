export class BackgroundRemovalProvider {
  constructor({ id, name }) {
    this.id = id
    this.name = name
  }

  async process() {
    throw new Error('O provider de remoção de fundo não implementou o processamento.')
  }
}
