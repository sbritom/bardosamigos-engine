import { Button, Input, Select, Textarea } from '../../../../design-system'

function normalizeValue(value) {
  return value ?? ''
}

export function CompetitionEntityForm({ fields, value, onChange, onSubmit, onCancel, submitting }) {
  function updateField(key, fieldValue, type) {
    onChange({
      ...value,
      [key]: type === 'number' ? Number(fieldValue) : fieldValue,
    })
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => {
          if (field.type === 'select') {
            return (
              <Select
                key={field.key}
                label={field.label}
                value={normalizeValue(value[field.key])}
                options={(field.options || []).map((option) => ({ label: option, value: option }))}
                onChange={(event) => updateField(field.key, event.target.value, field.type)}
                required={field.required}
              />
            )
          }

          if (field.type === 'textarea') {
            return (
              <div key={field.key} className="md:col-span-2">
                <Textarea
                  label={field.label}
                  value={normalizeValue(value[field.key])}
                  onChange={(event) => updateField(field.key, event.target.value, field.type)}
                  required={field.required}
                />
              </div>
            )
          }

          return (
            <Input
              key={field.key}
              label={field.label}
              type={field.type || 'text'}
              value={normalizeValue(value[field.key])}
              onChange={(event) => updateField(field.key, event.target.value, field.type)}
              required={field.required}
            />
          )
        })}
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={submitting}>{submitting ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  )
}
