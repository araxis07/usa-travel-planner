import TravelImage from './TravelImage';
import { useState } from 'react';
import {
  STATES,
  INTEREST_LABELS,
  local,
  type Language,
  type Interest,
  type Trip,
  type StateGuide,
} from '../data/travel';
import { x } from '../data/experience-copy';
import { LOCALES } from '../lib/i18n';
import { starterTrip } from '../data/itineraries';
import Dialog from './Dialog';
import Icon from './Icon';
export default function TripWizard({
  lang,
  onClose,
  onCreate,
  onOpen,
}: {
  lang: Language;
  onClose: () => void;
  onCreate: (trip: Trip) => void;
  onOpen: (state: StateGuide, index: number) => void;
}) {
  const [step, setStep] = useState(0);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [days, setDays] = useState(3);
  const [car, setCar] = useState(false);
  const [family, setFamily] = useState(false);
  const [interest, setInterest] = useState<Interest>('Cities');
  const places = STATES.flatMap((state) =>
    state.destinations.map((profile, index) => ({ state, profile, index })),
  )
    .filter((p) => !p.profile.advisory && (car || p.profile.planning?.transport === 'transit'))
    .map((p) => ({
      ...p,
      score:
        (p.profile.planning?.months.includes(month) ? 3 : 0) +
        (p.profile.planning?.interest === interest ? 4 : 0) +
        (family && p.profile.planning?.walking === 'easy' ? 2 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  return (
    <Dialog title={x(lang, 'wizard')} onClose={onClose} closeLabel={x(lang, 'cancel')} wide>
      <section className="wizard-panel">
        <span className="eyebrow">ROAM / 0{step + 1}</span>
        <h2>{x(lang, step === 2 ? 'results' : 'wizard')}</h2>
        <div
          className="wizard-progress"
          role="progressbar"
          aria-label={x(lang, 'wizard')}
          aria-valuemin={1}
          aria-valuemax={3}
          aria-valuenow={step + 1}
        >
          {[0, 1, 2].map((i) => (
            <span key={i} className={i <= step ? 'complete' : ''} />
          ))}
        </div>
        {step === 0 && (
          <div className="wizard-fields">
            <label>
              {x(lang, 'month')}
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i + 1}>
                    {new Intl.DateTimeFormat(LOCALES[lang], { month: 'long' }).format(
                      new Date(2026, i, 1),
                    )}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {x(lang, 'duration')}
              <input
                type="number"
                min={1}
                max={14}
                value={days}
                onChange={(e) =>
                  setDays(Math.max(1, Math.min(14, Math.round(Number(e.target.value) || 1))))
                }
              />
            </label>
            <label>
              {x(lang, 'party')}
              <select
                value={family ? 'family' : 'adults'}
                onChange={(e) => setFamily(e.target.value === 'family')}
              >
                <option value="adults">{x(lang, 'adults')}</option>
                <option value="family">{x(lang, 'family')}</option>
              </select>
            </label>
          </div>
        )}
        {step === 1 && (
          <div className="wizard-fields">
            <label>
              {x(lang, 'interest')}
              <select value={interest} onChange={(e) => setInterest(e.target.value as Interest)}>
                {Object.entries(INTEREST_LABELS).map(([id, name]) => (
                  <option key={id} value={id}>
                    {local(name, lang)}
                  </option>
                ))}
              </select>
            </label>
            <fieldset>
              <legend>{x(lang, 'transport')}</legend>
              <label>
                <input
                  type="radio"
                  name="wizard-car"
                  checked={!car}
                  onChange={() => setCar(false)}
                />
                {x(lang, 'withoutCar')}
              </label>
              <label>
                <input type="radio" name="wizard-car" checked={car} onChange={() => setCar(true)} />
                {x(lang, 'withCar')}
              </label>
            </fieldset>
          </div>
        )}
        {step === 2 && (
          <>
            <p>{x(lang, 'preserveTrip')}</p>
            <div className="wizard-results">
              {places.map((p) => (
                <article key={p.profile.id}>
                  <TravelImage
                    src={p.state.photos.find((v) => v.placeIndex === p.index)!.src}
                    alt=""
                    width="400"
                    height="240"
                  />
                  <div>
                    <span className="eyebrow">{p.state.code} / USA</span>
                    <h3>{local(p.state.placeNames[p.index], lang)}</h3>
                    <ul>
                      {p.profile.planning?.months.includes(month) && (
                        <li>{x(lang, 'matchedSeason')}</li>
                      )}
                      {p.profile.planning?.interest === interest && (
                        <li>{x(lang, 'matchedInterest')}</li>
                      )}
                      {!car && <li>{x(lang, 'transit')}</li>}
                      {family && p.profile.planning?.walking === 'easy' && (
                        <li>{x(lang, 'flexibleFamily')}</li>
                      )}
                    </ul>
                    <button
                      className="button button-red"
                      onClick={() => onCreate(starterTrip(p.profile.id, days, lang))}
                    >
                      {x(lang, 'usePlan')}
                    </button>
                    <button className="text-link" onClick={() => onOpen(p.state, p.index)}>
                      {x(lang, 'readMore')}
                      <Icon name="arrow" size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <p className="fine-print">{x(lang, 'editorial')}</p>
          </>
        )}
        <div className="wizard-actions">
          {step > 0 && (
            <button className="button button-outline" onClick={() => setStep(step - 1)}>
              {x(lang, 'back')}
            </button>
          )}
          {step < 2 && (
            <button className="button button-red" onClick={() => setStep(step + 1)}>
              {x(lang, 'next')}
              <Icon name="arrow" size={16} />
            </button>
          )}
        </div>
      </section>
    </Dialog>
  );
}
