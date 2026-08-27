import { UploadCloud } from "lucide-react";

export default function RadioUploadZone() {
  return (
    <section className="bar-radio-upload">
      <UploadCloud size={42} />
      <div>
        <h3>Arraste seus arquivos aqui</h3>
        <p>Upload multiplo, fila, progresso e leitura automatica de metadados estao preparados com mocks.</p>
      </div>
      <button className="bar-radio-button" type="button">Selecionar arquivos</button>
    </section>
  );
}
