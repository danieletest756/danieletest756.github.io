import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Section, Empty, Modal, Field, Spinner, IconPlus, IconEdit, IconTrash } from '../components/ui'
import { useToast, useConfirm } from '../components/Feedback'

export default function Dieta() {
  const { targetId, canEdit } = useAuth()
  const [plan, setPlan] = useState(undefined)
  const [meals, setMeals] = useState([])
  const [foods, setFoods] = useState({})
  const [editPlan, setEditPlan] = useState(null)
  const [editFood, setEditFood] = useState(null)
  const [editMeal, setEditMeal] = useState(null)

  const load = useCallback(async () => {
    if (!targetId) return
    const { data: p } = await supabase.from('diet_plans').select('*')
      .eq('user_id', targetId).eq('is_active', true)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    setPlan(p ?? null)
    if (!p) { setMeals([]); setFoods({}); return }

    const { data: m } = await supabase.from('diet_meals').select('*').eq('plan_id', p.id).order('position')
    setMeals(m ?? [])
    const ids = (m ?? []).map((x) => x.id)
    if (!ids.length) return setFoods({})
    const { data: f } = await supabase.from('diet_foods').select('*').in('meal_id', ids).order('position')
    const g = {}
    ;(f ?? []).forEach((r) => { (g[r.meal_id] ||= []).push(r) })
    setFoods(g)
  }, [targetId])

  useEffect(() => { setPlan(undefined); load() }, [load])

  const totali = useMemo(() => {
    const t = { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
    Object.values(foods).flat().forEach((f) => {
      t.kcal += Number(f.kcal || 0); t.protein_g += Number(f.protein_g || 0)
      t.carbs_g += Number(f.carbs_g || 0); t.fat_g += Number(f.fat_g || 0)
    })
    return t
  }, [foods])

  if (!targetId || plan === undefined) return <Spinner />

  if (!plan) {
    return (
      <Empty
        title="Nessun piano alimentare"
        hint={canEdit ? 'Imposta i macro e i pasti per questo atleta.' : 'Il tuo coach non ha ancora caricato il piano.'}
        action={canEdit && <button onClick={() => setEditPlan({})} className="btn-primary">Crea piano</button>}
      >
        <ModalPiano plan={editPlan} userId={targetId} onClose={() => setEditPlan(null)} onDone={load} />
      </Empty>
    )
  }

  return (
    <>
      <Section>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="font-cond text-[30px] font-bold leading-none">{plan.title}</h1>
            {plan.water_l && <p className="mt-1.5 text-sm text-muted">Acqua: {plan.water_l} litri al giorno</p>}
          </div>
          {canEdit && (
            <button onClick={() => setEditPlan(plan)} className="btn-ghost px-3 py-2 text-sm">
              <IconEdit width={16} height={16} /> Modifica
            </button>
          )}
        </div>

        {/* obiettivo macro */}
        <div className="card mb-5 p-5">
          <div className="mb-4 flex items-end gap-2">
            <span className="stat text-[42px] leading-none">{plan.kcal ?? '—'}</span>
            <span className="mb-1 text-sm text-muted">kcal al giorno</span>
          </div>
          <div className="space-y-3">
            <Macro nome="Proteine"    target={plan.protein_g} ora={totali.protein_g} colore="#1F4FD8" />
            <Macro nome="Carboidrati" target={plan.carbs_g}   ora={totali.carbs_g}   colore="#F2B705" />
            <Macro nome="Grassi"      target={plan.fat_g}     ora={totali.fat_g}     colore="#1B7F5A" />
          </div>
          <p className="mt-4 text-[13px] text-muted">
            I valori a destra sono la somma degli alimenti inseriti nei pasti qui sotto.
          </p>
        </div>

        {plan.notes && (
          <p className="mb-5 whitespace-pre-line rounded-xl bg-brandsoft px-4 py-3.5 text-sm leading-relaxed text-ink/80">
            {plan.notes}
          </p>
        )}

        {meals.length === 0 ? (
          <Empty title="Nessun pasto inserito" hint={canEdit ? 'Aggiungi il primo pasto.' : ''} />
        ) : (
          <div className="space-y-4">
            {meals.map((m) => {
              const lista = foods[m.id] ?? []
              const k = lista.reduce((s, f) => s + Number(f.kcal || 0), 0)
              return (
                <div key={m.id} className="card overflow-hidden">
                  <div className="flex items-center justify-between border-b border-line px-4 py-3">
                    <div>
                      <p className="font-cond text-[21px] font-semibold leading-none">{m.name}</p>
                      {m.time_label && <p className="mt-1 text-[12.5px] text-muted">{m.time_label}</p>}
                    </div>
                    <span className="stat text-[19px] text-muted">{Math.round(k)} kcal</span>
                  </div>

                  <ul className="divide-y divide-line">
                    {lista.map((f) => (
                      <li key={f.id} className="flex items-start gap-3 px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium leading-tight">{f.name}</p>
                          <p className="text-[13px] text-muted">
                            {f.qty}
                            {f.protein_g != null && ` · P ${f.protein_g}`}
                            {f.carbs_g != null && ` C ${f.carbs_g}`}
                            {f.fat_g != null && ` G ${f.fat_g}`}
                          </p>
                          {f.alt && <p className="mt-1 text-[13px] text-muted">In alternativa: {f.alt}</p>}
                        </div>
                        <span className="stat pt-0.5 text-[17px] text-muted">{f.kcal ?? '—'}</span>
                        {canEdit && (
                          <button onClick={() => setEditFood(f)} className="pt-0.5 text-muted" aria-label="Modifica">
                            <IconEdit width={17} height={17} />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>

                  {m.notes && <p className="px-4 py-3 text-sm text-muted">{m.notes}</p>}

                  {canEdit && (
                    <div className="flex gap-2 border-t border-line px-4 py-3">
                      <button onClick={() => setEditFood({ meal_id: m.id, position: lista.length + 1 })}
                              className="btn-ghost px-3 py-1.5 text-sm">
                        <IconPlus width={16} height={16} /> Alimento
                      </button>
                      <button onClick={() => setEditMeal(m)} className="btn-ghost px-3 py-1.5 text-sm">
                        <IconEdit width={16} height={16} /> Pasto
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {canEdit && (
          <button
            onClick={() => setEditMeal({ plan_id: plan.id, position: meals.length + 1 })}
            className="btn-ghost mt-4 w-full border-dashed"
          >
            <IconPlus width={18} height={18} /> Aggiungi pasto
          </button>
        )}
      </Section>

      <ModalPiano plan={editPlan} userId={targetId} onClose={() => setEditPlan(null)} onDone={load} />
      <ModalAlimento food={editFood} onClose={() => setEditFood(null)} onDone={load} />
      <ModalPasto meal={editMeal} onClose={() => setEditMeal(null)} onDone={load} />
    </>
  )
}

/* Nome, orario e nota del pasto: prima si poteva solo crearlo, con un prompt del browser. */
function ModalPasto({ meal, onClose, onDone }) {
  const [f, setF] = useState({ name: '', time_label: '', notes: '' })
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const chiedi = useConfirm()

  useEffect(() => {
    if (meal) setF({ name: meal.name ?? '', time_label: meal.time_label ?? '', notes: meal.notes ?? '' })
  }, [meal])

  if (!meal) return null
  const nuovo = !meal.id

  async function salva(e) {
    e.preventDefault()
    setBusy(true)
    const p = { name: f.name.trim(), time_label: f.time_label.trim() || null, notes: f.notes.trim() || null }
    const { error } = nuovo
      ? await supabase.from('diet_meals').insert({ ...p, plan_id: meal.plan_id, position: meal.position })
      : await supabase.from('diet_meals').update(p).eq('id', meal.id)
    setBusy(false)
    if (error) return toast.err(error)
    toast.ok(nuovo ? 'Pasto aggiunto' : 'Pasto aggiornato')
    onClose(); onDone()
  }

  async function elimina() {
    const ok = await chiedi({
      title: `Elimino «${meal.name}»?`,
      body: 'Spariscono anche tutti gli alimenti che hai messo in questo pasto.',
      conferma: 'Elimina il pasto',
      danger: true,
    })
    if (!ok) return
    setBusy(true)
    const { error } = await supabase.from('diet_meals').delete().eq('id', meal.id)
    setBusy(false)
    if (error) return toast.err(error)
    toast.ok('Pasto eliminato')
    onClose(); onDone()
  }

  return (
    <Modal open onClose={onClose} title={nuovo ? 'Nuovo pasto' : 'Modifica pasto'}>
      <form onSubmit={salva} className="space-y-4">
        <Field label="Nome del pasto" value={f.name} required autoFocus
               onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Colazione" />
        <Field label="Quando" value={f.time_label}
               onChange={(e) => setF({ ...f, time_label: e.target.value })}
               placeholder="07:30" hint="Un orario o un momento: «pre-workout», «dopo la palestra»." />
        <label className="block">
          <span className="label">Nota</span>
          <textarea className="field min-h-[70px]" value={f.notes}
                    onChange={(e) => setF({ ...f, notes: e.target.value })}
                    placeholder="Se ti alleni la mattina, sposta i carboidrati qui." />
        </label>
        <div className="flex gap-3 pt-1">
          <button className="btn-primary flex-1" disabled={busy}>{busy ? 'Salvo…' : 'Salva'}</button>
          {!nuovo && (
            <button type="button" onClick={elimina} disabled={busy} className="btn-danger" aria-label="Elimina pasto">
              <IconTrash width={18} height={18} />
            </button>
          )}
        </div>
      </form>
    </Modal>
  )
}

function Macro({ nome, target, ora, colore }) {
  const pct = target ? Math.min(100, (ora / target) * 100) : 0
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className="font-medium">{nome}</span>
        <span className="text-muted">
          <b className="stat text-[17px] text-ink">{Math.round(ora)}</b> / {target ?? '—'} g
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-canvas">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colore }} />
      </div>
    </div>
  )
}

function ModalPiano({ plan, userId, onClose, onDone }) {
  const [f, setF] = useState({})
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  useEffect(() => {
    if (plan) setF({
      title: plan.title ?? 'Piano alimentare', kcal: plan.kcal ?? '', protein_g: plan.protein_g ?? '',
      carbs_g: plan.carbs_g ?? '', fat_g: plan.fat_g ?? '', water_l: plan.water_l ?? 2.5, notes: plan.notes ?? '',
    })
  }, [plan])
  if (!plan) return null
  const nuovo = !plan.id

  async function salva(e) {
    e.preventDefault()
    setBusy(true)
    const p = {
      title: f.title, kcal: num(f.kcal), protein_g: num(f.protein_g), carbs_g: num(f.carbs_g),
      fat_g: num(f.fat_g), water_l: num(f.water_l), notes: f.notes || null,
    }
    const { error } = nuovo
      ? await supabase.from('diet_plans').insert({ ...p, user_id: userId, is_active: true })
      : await supabase.from('diet_plans').update(p).eq('id', plan.id)
    setBusy(false)
    if (error) return toast.err(error)
    toast.ok(nuovo ? 'Piano alimentare creato' : 'Piano aggiornato')
    onClose(); onDone()
  }

  return (
    <Modal open onClose={onClose} title={nuovo ? 'Nuovo piano alimentare' : 'Modifica piano'}>
      <form onSubmit={salva} className="space-y-4">
        <Field label="Titolo" value={f.title ?? ''} onChange={(e) => setF({ ...f, title: e.target.value })} required />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Calorie" type="number" inputMode="numeric" value={f.kcal ?? ''} onChange={(e) => setF({ ...f, kcal: e.target.value })} />
          <Field label="Acqua (litri)" type="number" step="0.1" value={f.water_l ?? ''} onChange={(e) => setF({ ...f, water_l: e.target.value })} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Proteine g" type="number" value={f.protein_g ?? ''} onChange={(e) => setF({ ...f, protein_g: e.target.value })} />
          <Field label="Carbo g" type="number" value={f.carbs_g ?? ''} onChange={(e) => setF({ ...f, carbs_g: e.target.value })} />
          <Field label="Grassi g" type="number" value={f.fat_g ?? ''} onChange={(e) => setF({ ...f, fat_g: e.target.value })} />
        </div>
        <label className="block">
          <span className="label">Linee guida</span>
          <textarea className="field min-h-[100px]" value={f.notes ?? ''}
                    onChange={(e) => setF({ ...f, notes: e.target.value })}
                    placeholder="Una fonte proteica in ognuno dei 3 pasti più uno spuntino. Carboidrati non tagliati nei giorni di allenamento." />
        </label>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Salvo…' : 'Salva piano'}</button>
      </form>
    </Modal>
  )
}

function ModalAlimento({ food, onClose, onDone }) {
  const [f, setF] = useState({})
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const chiedi = useConfirm()
  useEffect(() => { if (food) setF({ ...food }) }, [food])
  if (!food) return null
  const nuovo = !food.id

  async function salva(e) {
    e.preventDefault()
    setBusy(true)
    const p = {
      name: f.name, qty: f.qty || null, kcal: num(f.kcal), protein_g: num(f.protein_g),
      carbs_g: num(f.carbs_g), fat_g: num(f.fat_g), alt: f.alt || null,
    }
    const { error } = nuovo
      ? await supabase.from('diet_foods').insert({ ...p, meal_id: food.meal_id, position: food.position })
      : await supabase.from('diet_foods').update(p).eq('id', food.id)
    setBusy(false)
    if (error) return toast.err(error)
    toast.ok(nuovo ? 'Alimento aggiunto' : 'Alimento aggiornato')
    onClose(); onDone()
  }

  async function elimina() {
    const ok = await chiedi({
      title: `Elimino «${food.name}»?`,
      conferma: 'Elimina',
      danger: true,
    })
    if (!ok) return
    setBusy(true)
    const { error } = await supabase.from('diet_foods').delete().eq('id', food.id)
    setBusy(false)
    if (error) return toast.err(error)
    toast.ok('Alimento eliminato')
    onClose(); onDone()
  }

  return (
    <Modal open onClose={onClose} title={nuovo ? 'Aggiungi alimento' : 'Modifica alimento'}>
      <form onSubmit={salva} className="space-y-4">
        <Field label="Alimento" value={f.name ?? ''} onChange={(e) => setF({ ...f, name: e.target.value })}
               placeholder="Yogurt greco 0%" required />
        <Field label="Quantità" value={f.qty ?? ''} onChange={(e) => setF({ ...f, qty: e.target.value })}
               placeholder="170 g" />
        <div className="grid grid-cols-4 gap-2">
          <Field label="kcal" type="number" value={f.kcal ?? ''} onChange={(e) => setF({ ...f, kcal: e.target.value })} />
          <Field label="P" type="number" step="0.1" value={f.protein_g ?? ''} onChange={(e) => setF({ ...f, protein_g: e.target.value })} />
          <Field label="C" type="number" step="0.1" value={f.carbs_g ?? ''} onChange={(e) => setF({ ...f, carbs_g: e.target.value })} />
          <Field label="G" type="number" step="0.1" value={f.fat_g ?? ''} onChange={(e) => setF({ ...f, fat_g: e.target.value })} />
        </div>
        <Field label="Alternativa consentita" value={f.alt ?? ''} onChange={(e) => setF({ ...f, alt: e.target.value })}
               placeholder="3 uova intere" />
        <div className="flex gap-3">
          <button className="btn-primary flex-1" disabled={busy}>{busy ? 'Salvo…' : 'Salva'}</button>
          {!nuovo && (
            <button type="button" onClick={elimina} disabled={busy} className="btn-danger" aria-label="Elimina alimento">
              <IconTrash width={18} height={18} />
            </button>
          )}
        </div>
      </form>
    </Modal>
  )
}

const num = (v) => (v === '' || v == null ? null : Number(v))
