"use client";

import { useMemo, useState } from "react";

const DEFAULTS = {
  regularMembers: 25,
  reducedMembers: 10,
  businessMembers: 1,

  regularFee: 50,
  regularFeePeriod: "year",
  reducedFee: 30,
  reducedFeePeriod: "year",
  businessFee: 600,
  businessFeePeriod: "year",

  deliveriesMonth: 35,
  avgDeliveryFee: 5.5,

  courierPayModel: "minimumWage",
  managementPayModel: "minimumWage",
  minimumWage: 13.9,
  courierPersons: 2,
  managementPersons: 1,
  hoursPerDelivery: 0.5,
  managementHoursMonth: 5,
  allowancePerPersonYear: 960,

  paymentFeePct: 2.7,
  carSharePct: 15,
  kmPerCarDelivery: 8,
  carCostKm: 0.3,

  fundingEnabled: false,
  fundingPct: 50,

  cargoBikeMode: "lease",
  cargoBikeLeaseMonth: 90,
  cargoBikePurchase: 3000,

  bikeCount: 2,
  bikePrice: 400,
  usefulLifeYears: 3,
  bikeEquipmentPerBikeYear: 200,
  bikeMaintenancePerBikeYear: 100,

  hostingYear: 180,
  developerAccountsYear: 116,
  insuranceYear: 515,
  marketingYear: 300,
  adminYear: 75,
};

function eur(value) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value || 0);
}

function signed(value) {
  return value >= 0 ? `+ ${eur(value)}` : `- ${eur(Math.abs(value))}`;
}

function annualize(amount, period) {
  return period === "month" ? amount * 12 : amount;
}

function SliderField({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  suffix = "",
}) {
  return (
    <label className="pl-input">
      <span>{label}</span>
      <div className="pl-slider-box">
        <input
          className="pl-range"
          type="range"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <div className="pl-number-row">
          <input
            className="pl-number"
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          {suffix && <small>{suffix}</small>}
        </div>
      </div>
    </label>
  );
}

function AmountField({
  label,
  amount,
  period,
  onAmountChange,
  onPeriodChange,
  maxYear = 1000,
  stepYear = 5,
}) {
  const factor = period === "month" ? 12 : 1;
  const max = maxYear / factor;
  const step = stepYear / factor;

  return (
    <label className="pl-input">
      <span>{label}</span>
      <div className="pl-slider-box">
        <input
          className="pl-range"
          type="range"
          value={amount}
          min={0}
          max={max}
          step={step}
          onChange={(e) => onAmountChange(Number(e.target.value))}
        />
        <div className="pl-number-row">
          <input
            className="pl-number"
            type="number"
            value={amount}
            min={0}
            max={max}
            step={step}
            onChange={(e) => onAmountChange(Number(e.target.value))}
          />
          <small>€</small>
          <select value={period} onChange={(e) => onPeriodChange(e.target.value)}>
            <option value="year">/ Jahr</option>
            <option value="month">/ Monat</option>
          </select>
        </div>
      </div>
    </label>
  );
}

function PayModelSelect({ label, value, onChange }) {
  return (
    <label className="pl-input">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="minimumWage">Mindestlohn: 13,90 €/h</option>
        <option value="allowance">Ehrenamtspauschale: 960 €/Jahr</option>
      </select>
    </label>
  );
}

export default function ProfitLossCalculator() {
  const [a, setA] = useState(DEFAULTS);

  const update = (key, value) => {
    setA((prev) => ({ ...prev, [key]: value }));
  };

  const updatePeriod = (amountKey, periodKey, newPeriod) => {
    setA((prev) => {
      const annualValue = annualize(prev[amountKey], prev[periodKey]);
      const newAmount = newPeriod === "month" ? annualValue / 12 : annualValue;

      return {
        ...prev,
        [periodKey]: newPeriod,
        [amountKey]: Math.round(newAmount * 100) / 100,
      };
    });
  };

  const r = useMemo(() => {
    const deliveriesYear = a.deliveriesMonth * 12;

    const regularRevenue =
      a.regularMembers * annualize(a.regularFee, a.regularFeePeriod);
    const reducedRevenue =
      a.reducedMembers * annualize(a.reducedFee, a.reducedFeePeriod);
    const businessRevenue =
      a.businessMembers * annualize(a.businessFee, a.businessFeePeriod);
    const deliveryRevenue = deliveriesYear * a.avgDeliveryFee;

    const totalRevenue =
      regularRevenue + reducedRevenue + businessRevenue + deliveryRevenue;

    const courierLabor =
      a.courierPayModel === "minimumWage"
        ? deliveriesYear * a.hoursPerDelivery * a.minimumWage
        : a.courierPersons * a.allowancePerPersonYear;

    const managementLabor =
      a.managementPayModel === "minimumWage"
        ? a.managementHoursMonth * 12 * a.minimumWage
        : a.managementPersons * a.allowancePerPersonYear;

    const carDeliveries = deliveriesYear * (a.carSharePct / 100);
    const carCosts = carDeliveries * a.kmPerCarDelivery * a.carCostKm;

    const paymentFees = totalRevenue * (a.paymentFeePct / 100);

    const bikePurchaseAnnualized =
      (a.bikeCount * a.bikePrice) / Math.max(a.usefulLifeYears, 1);

    const cargoBikeAnnualized =
      a.cargoBikeMode === "buy"
        ? a.cargoBikePurchase / Math.max(a.usefulLifeYears, 1)
        : 0;

    const cargoBikeLease =
      a.cargoBikeMode === "lease" ? a.cargoBikeLeaseMonth * 12 : 0;

    const totalBikeCount = a.bikeCount + 1;

    const bikeEquipment =
      totalBikeCount * a.bikeEquipmentPerBikeYear;

    const bikeMaintenance =
      totalBikeCount * a.bikeMaintenancePerBikeYear;

    const digitalCosts = a.hostingYear + a.developerAccountsYear;

    const opex = a.insuranceYear + a.marketingYear + a.adminYear;

    const eligibleCosts =
      courierLabor +
      managementLabor +
      carCosts +
      a.marketingYear +
      digitalCosts +
      bikePurchaseAnnualized +
      cargoBikeAnnualized +
      cargoBikeLease +
      bikeEquipment +
      bikeMaintenance;

    const fundingAmount = a.fundingEnabled
      ? eligibleCosts * (a.fundingPct / 100)
      : 0;

    const totalCostsBeforeFunding =
      courierLabor +
      managementLabor +
      carCosts +
      paymentFees +
      bikePurchaseAnnualized +
      cargoBikeAnnualized +
      cargoBikeLease +
      bikeEquipment +
      bikeMaintenance +
      digitalCosts +
      opex;

    const netResult = totalRevenue - totalCostsBeforeFunding + fundingAmount;

    const grossProfit =
      totalRevenue -
      courierLabor -
      managementLabor -
      carCosts -
      paymentFees -
      bikePurchaseAnnualized -
      cargoBikeAnnualized -
      cargoBikeLease -
      bikeEquipment -
      bikeMaintenance;

    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const cogsPerDelivery =
      deliveriesYear > 0
        ? (courierLabor +
            carCosts +
            paymentFees +
            bikePurchaseAnnualized +
            cargoBikeAnnualized +
            cargoBikeLease +
            bikeEquipment +
            bikeMaintenance) /
          deliveriesYear
        : 0;

    return {
      deliveriesYear,
      regularRevenue,
      reducedRevenue,
      businessRevenue,
      deliveryRevenue,
      totalRevenue,
      courierLabor,
      managementLabor,
      carCosts,
      paymentFees,
      bikePurchaseAnnualized,
      cargoBikeAnnualized,
      cargoBikeLease,
      bikeEquipment,
      bikeMaintenance,
      digitalCosts,
      opex,
      eligibleCosts,
      fundingAmount,
      totalCostsBeforeFunding,
      grossProfit,
      grossMargin,
      cogsPerDelivery,
      netResult,
    };
  }, [a]);

  return (
    <section className="bringo-pl">
      <style>{styles}</style>

      <aside className="pl-left">
        <div className="pl-logo">
          <div className="pl-logo-icon">↗</div>
          <strong>bringo</strong>
        </div>

        <div className="pl-pill">EINGABEN</div>

        <h1>
          Profit & Loss
          <br />
          <span>Calculator</span>
        </h1>

        <div className="pl-form-section">
          <h3>Umsatz</h3>

          <div className="pl-pair">
            <SliderField
              label="Reguläre Mitglieder"
              value={a.regularMembers}
              min={0}
              max={150}
              onChange={(v) => update("regularMembers", v)}
            />
            <AmountField
              label="Regulärer Betrag"
              amount={a.regularFee}
              period={a.regularFeePeriod}
              maxYear={300}
              onAmountChange={(v) => update("regularFee", v)}
              onPeriodChange={(p) => updatePeriod("regularFee", "regularFeePeriod", p)}
            />
          </div>

          <div className="pl-pair">
            <SliderField
              label="Ermäßigte Mitglieder"
              value={a.reducedMembers}
              min={0}
              max={150}
              onChange={(v) => update("reducedMembers", v)}
            />
            <AmountField
              label="Ermäßigter Betrag"
              amount={a.reducedFee}
              period={a.reducedFeePeriod}
              maxYear={300}
              onAmountChange={(v) => update("reducedFee", v)}
              onPeriodChange={(p) => updatePeriod("reducedFee", "reducedFeePeriod", p)}
            />
          </div>

          <div className="pl-pair">
            <SliderField
              label="Business-Partner"
              value={a.businessMembers}
              min={0}
              max={20}
              onChange={(v) => update("businessMembers", v)}
            />
            <AmountField
              label="Business-Betrag"
              amount={a.businessFee}
              period={a.businessFeePeriod}
              maxYear={3000}
              stepYear={50}
              onAmountChange={(v) => update("businessFee", v)}
              onPeriodChange={(p) => updatePeriod("businessFee", "businessFeePeriod", p)}
            />
          </div>

          <div className="pl-pair">
            <SliderField
              label="Lieferungen / Monat"
              value={a.deliveriesMonth}
              min={0}
              max={250}
              onChange={(v) => update("deliveriesMonth", v)}
            />
            <SliderField
              label="Ø Liefergebühr"
              value={a.avgDeliveryFee}
              min={0}
              max={20}
              step={0.5}
              suffix="€"
              onChange={(v) => update("avgDeliveryFee", v)}
            />
          </div>
        </div>

        <div className="pl-form-section">
          <h3>Lohn & Lieferung</h3>

          <div className="pl-control-grid">
            <PayModelSelect
              label="Lohn Kurier:innen"
              value={a.courierPayModel}
              onChange={(v) => update("courierPayModel", v)}
            />
            <PayModelSelect
              label="Lohn Personalmanagement"
              value={a.managementPayModel}
              onChange={(v) => update("managementPayModel", v)}
            />

            <SliderField
              label="Kurier:innen"
              value={a.courierPersons}
              min={1}
              max={10}
              onChange={(v) => update("courierPersons", v)}
            />
            <SliderField
              label="Personalmanagement"
              value={a.managementPersons}
              min={1}
              max={5}
              onChange={(v) => update("managementPersons", v)}
            />

            <SliderField
              label="Zeit / Lieferung"
              value={a.hoursPerDelivery}
              min={0.1}
              max={2}
              step={0.05}
              suffix="h"
              onChange={(v) => update("hoursPerDelivery", v)}
            />
            <SliderField
              label="PM-Stunden / Monat"
              value={a.managementHoursMonth}
              min={0}
              max={40}
              step={0.5}
              suffix="h"
              onChange={(v) => update("managementHoursMonth", v)}
            />

            <SliderField
              label="Auto-Anteil"
              value={a.carSharePct}
              min={0}
              max={100}
              suffix="%"
              onChange={(v) => update("carSharePct", v)}
            />
            <SliderField
              label="Km / Auto-Lieferung"
              value={a.kmPerCarDelivery}
              min={0}
              max={40}
              suffix="km"
              onChange={(v) => update("kmPerCarDelivery", v)}
            />

            <SliderField
              label="Auto-Kosten"
              value={a.carCostKm}
              min={0}
              max={1}
              step={0.05}
              suffix="€/km"
              onChange={(v) => update("carCostKm", v)}
            />
            <SliderField
              label="Payment Fee"
              value={a.paymentFeePct}
              min={0}
              max={6}
              step={0.1}
              suffix="%"
              onChange={(v) => update("paymentFeePct", v)}
            />
          </div>

          <label className="pl-check">
            <input
              type="checkbox"
              checked={a.fundingEnabled}
              onChange={(e) => update("fundingEnabled", e.target.checked)}
            />
            <span>Förderung „Digitale regionale Heimatprojekte“</span>
          </label>

          {a.fundingEnabled && (
            <SliderField
              label="Förderquote"
              value={a.fundingPct}
              min={50}
              max={75}
              step={5}
              suffix="%"
              onChange={(v) => update("fundingPct", v)}
            />
          )}
        </div>

        <div className="pl-form-section">
          <h3>Equipment & OPEX</h3>

          <div className="pl-control-grid">
            <label className="pl-input">
              <span>Lastenrad-Modell</span>
              <select
                value={a.cargoBikeMode}
                onChange={(e) => update("cargoBikeMode", e.target.value)}
              >
                <option value="lease">Leasing</option>
                <option value="buy">Kauf</option>
              </select>
            </label>

            {a.cargoBikeMode === "lease" ? (
              <SliderField
                label="Lastenrad Leasing"
                value={a.cargoBikeLeaseMonth}
                min={0}
                max={300}
                step={5}
                suffix="€/Monat"
                onChange={(v) => update("cargoBikeLeaseMonth", v)}
              />
            ) : (
              <SliderField
                label="Lastenrad Kauf"
                value={a.cargoBikePurchase}
                min={0}
                max={8000}
                step={100}
                suffix="€"
                onChange={(v) => update("cargoBikePurchase", v)}
              />
            )}

            <SliderField
              label="(Falt-)Räder"
              value={a.bikeCount}
              min={0}
              max={10}
              onChange={(v) => update("bikeCount", v)}
            />
            <SliderField
              label="Preis / (Falt-)Rad"
              value={a.bikePrice}
              min={0}
              max={1500}
              step={50}
              suffix="€"
              onChange={(v) => update("bikePrice", v)}
            />

            <SliderField
              label="Nutzungsdauer"
              value={a.usefulLifeYears}
              min={1}
              max={7}
              suffix="Jahre"
              onChange={(v) => update("usefulLifeYears", v)}
            />
            <SliderField
              label="Fahrradequipment"
              value={a.bikeEquipmentPerBikeYear}
              min={0}
              max={500}
              step={25}
              suffix="€/Rad/Jahr"
              onChange={(v) => update("bikeEquipmentPerBikeYear", v)}
            />

            <SliderField
              label="Fahrrad-Instandhaltung"
              value={a.bikeMaintenancePerBikeYear}
              min={0}
              max={500}
              step={25}
              suffix="€/Rad/Jahr"
              onChange={(v) => update("bikeMaintenancePerBikeYear", v)}
            />
            <SliderField
              label="Marketing"
              value={a.marketingYear}
              min={0}
              max={3000}
              step={50}
              suffix="€/Jahr"
              onChange={(v) => update("marketingYear", v)}
            />

            <SliderField
              label="Hosting / Website"
              value={a.hostingYear}
              min={0}
              max={1000}
              step={20}
              suffix="€/Jahr"
              onChange={(v) => update("hostingYear", v)}
            />
            <SliderField
              label="Developer Accounts"
              value={a.developerAccountsYear}
              min={0}
              max={500}
              step={10}
              suffix="€/Jahr"
              onChange={(v) => update("developerAccountsYear", v)}
            />

            <SliderField
              label="Versicherung"
              value={a.insuranceYear}
              min={0}
              max={2000}
              step={25}
              suffix="€/Jahr"
              onChange={(v) => update("insuranceYear", v)}
            />
            <SliderField
              label="Admin"
              value={a.adminYear}
              min={0}
              max={1000}
              step={25}
              suffix="€/Jahr"
              onChange={(v) => update("adminYear", v)}
            />
          </div>
        </div>

        <button className="pl-reset" onClick={() => setA(DEFAULTS)}>
          Zurücksetzen
        </button>
      </aside>

      <main className="pl-right">
        <div className="pl-topbar">
          <div className="pl-language">
            <button className="active">🇩🇪 DE</button>
            <button>🇬🇧 EN</button>
          </div>
          <button className="pl-login">Anmelden</button>
        </div>

        <div className="pl-heading">
          <div className="pl-small-pill">
            <span></span> AUSGABE
          </div>
          <h2>
            Profit and
            <br />
            <span>Loss.</span>
          </h2>
        </div>

        <div className="pl-kpis">
          <div>
            <span>Nettoergebnis</span>
            <strong className={r.netResult >= 0 ? "pos" : "neg"}>
              {signed(r.netResult)}
            </strong>
          </div>
          <div>
            <span>COGS / Lieferung</span>
            <strong>{eur(r.cogsPerDelivery)}</strong>
          </div>
          <div>
            <span>Gross Margin</span>
            <strong>{r.grossMargin.toFixed(1)} %</strong>
          </div>
        </div>

        <section className="pl-table-card">
          <table>
            <thead>
              <tr>
                <th>Position</th>
                <th>Betrag Jahr 1</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Reguläre Mitgliedsbeiträge</td>
                <td className="pos">{signed(r.regularRevenue)}</td>
              </tr>
              <tr>
                <td>Ermäßigte Mitgliedsbeiträge</td>
                <td className="pos">{signed(r.reducedRevenue)}</td>
              </tr>
              <tr>
                <td>Business-Beiträge</td>
                <td className="pos">{signed(r.businessRevenue)}</td>
              </tr>
              <tr>
                <td>Liefergebühren</td>
                <td className="pos">{signed(r.deliveryRevenue)}</td>
              </tr>
              <tr className="sum">
                <td>Gesamtumsatz</td>
                <td className="pos">{signed(r.totalRevenue)}</td>
              </tr>

              <tr>
                <td>Personal Kurier:innen</td>
                <td className="neg">{signed(-r.courierLabor)}</td>
              </tr>
              <tr>
                <td>Personalmanagement</td>
                <td className="neg">{signed(-r.managementLabor)}</td>
              </tr>
              <tr>
                <td>Fahrten / Auto</td>
                <td className="neg">{signed(-r.carCosts)}</td>
              </tr>
              <tr>
                <td>Payment Fees</td>
                <td className="neg">{signed(-r.paymentFees)}</td>
              </tr>
              <tr>
                <td>(Falt-)Räder annualisiert</td>
                <td className="neg">{signed(-r.bikePurchaseAnnualized)}</td>
              </tr>
              <tr>
                <td>Lastenrad</td>
                <td className="neg">
                  {signed(-(r.cargoBikeAnnualized + r.cargoBikeLease))}
                </td>
              </tr>
              <tr>
                <td>Fahrradequipment</td>
                <td className="neg">{signed(-r.bikeEquipment)}</td>
              </tr>
              <tr>
                <td>Fahrrad-Instandhaltung</td>
                <td className="neg">{signed(-r.bikeMaintenance)}</td>
              </tr>
              <tr>
                <td>Hosting / App / Website</td>
                <td className="neg">{signed(-r.digitalCosts)}</td>
              </tr>
              <tr>
                <td>Versicherung, Marketing, Admin</td>
                <td className="neg">{signed(-r.opex)}</td>
              </tr>

              {a.fundingEnabled && (
                <>
                  <tr className="sum">
                    <td>Zuwendungsfähige Kosten</td>
                    <td>{eur(r.eligibleCosts)}</td>
                  </tr>
                  <tr>
                    <td>Förderung ({a.fundingPct} %)</td>
                    <td className="pos">{signed(r.fundingAmount)}</td>
                  </tr>
                </>
              )}

              <tr className="net">
                <td>Nettoergebnis Jahr 1</td>
                <td className={r.netResult >= 0 ? "pos" : "neg"}>
                  {signed(r.netResult)}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="pl-breakdown">
          <div>
            <span>Lieferungen / Jahr</span>
            <strong>{r.deliveriesYear}</strong>
          </div>
          <div>
            <span>Kosten vor Förderung</span>
            <strong>{eur(r.totalCostsBeforeFunding)}</strong>
          </div>
          <div>
            <span>Förderung</span>
            <strong>{eur(r.fundingAmount)}</strong>
          </div>
          <div>
            <span>Gross Profit</span>
            <strong>{eur(r.grossProfit)}</strong>
          </div>
        </section>
      </main>
    </section>
  );
}

const styles = `
.bringo-pl {
  display: grid;
  grid-template-columns: 0.95fr 1.05fr;
  min-height: 100vh;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: #ffffff;
  color: #071225;
}

.pl-left {
  background:
    radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px),
    linear-gradient(145deg, #0c4425 0%, #135f34 100%);
  background-size: 32px 32px, auto;
  color: white;
  padding: 36px 42px;
  overflow-y: auto;
}

.pl-logo {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 26px;
  margin-bottom: 44px;
}

.pl-logo-icon {
  width: 46px;
  height: 46px;
  border-radius: 15px;
  background: rgba(255,255,255,0.14);
  border: 1px solid rgba(255,255,255,0.22);
  display: grid;
  place-items: center;
}

.pl-pill,
.pl-small-pill {
  width: fit-content;
  border-radius: 999px;
  font-weight: 800;
}

.pl-pill {
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.18);
  padding: 10px 20px;
  margin-bottom: 22px;
  color: #d8fbe5;
}

.pl-left h1 {
  font-size: clamp(38px, 4vw, 58px);
  line-height: 0.98;
  margin: 0 0 32px;
  letter-spacing: -0.05em;
}

.pl-left h1 span {
  color: #86efac;
}

.pl-form-section {
  margin-bottom: 30px;
}

.pl-form-section h3 {
  margin: 0 0 14px;
  color: #d8fbe5;
  font-size: 18px;
}

.pl-pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 14px;
}

.pl-control-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.pl-input span {
  display: block;
  font-size: 13px;
  font-weight: 800;
  color: rgba(255,255,255,0.78);
  margin-bottom: 6px;
}

.pl-slider-box,
.pl-input select {
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 14px;
  padding: 10px 12px;
  min-height: 62px;
}

.pl-input select {
  width: 100%;
  height: 44px;
  color: white;
  font-weight: 900;
  font-size: 15px;
  outline: 0;
}

.pl-input select option {
  color: #071225;
}

.pl-range {
  width: 100%;
  accent-color: #86efac;
}

.pl-number-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.pl-number {
  width: 100%;
  border: 0;
  outline: 0;
  background: rgba(255,255,255,0.16);
  color: white;
  font-weight: 900;
  font-size: 16px;
  border-radius: 10px;
  padding: 8px 10px;
}

.pl-number-row small {
  color: rgba(255,255,255,0.72);
  font-weight: 800;
  white-space: nowrap;
}

.pl-number-row select {
  width: auto;
  height: 36px;
  min-height: 36px;
  padding: 0 8px;
}

.pl-check {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 14px;
  padding: 14px 16px;
  margin: 18px 0 12px;
  font-weight: 900;
  color: #d8fbe5;
}

.pl-check input {
  width: 20px;
  height: 20px;
  accent-color: #86efac;
}

.pl-reset {
  width: 100%;
  border: 0;
  border-radius: 16px;
  background: #ffffff;
  color: #15803d;
  font-weight: 900;
  padding: 15px 18px;
  cursor: pointer;
  margin-top: 4px;
}

.pl-right {
  padding: 24px 42px 42px;
  overflow-x: hidden;
}

.pl-topbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
  margin-bottom: 44px;
}

.pl-language {
  background: #f0f2f5;
  border-radius: 999px;
  padding: 6px;
  display: flex;
  box-shadow: 0 8px 24px rgba(10,20,40,0.1);
}

.pl-language button,
.pl-login {
  border: 0;
  background: transparent;
  font-weight: 900;
  font-size: 17px;
  padding: 12px 18px;
  border-radius: 999px;
}

.pl-language .active {
  background: white;
  box-shadow: 0 4px 14px rgba(10,20,40,0.12);
}

.pl-login {
  border: 2px solid #16a34a;
  color: #15803d;
  background: white;
}

.pl-heading {
  margin-bottom: 28px;
}

.pl-small-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #eafff1;
  border: 1px solid #c7f7d6;
  color: #087b38;
  padding: 9px 16px;
  font-size: 14px;
  margin-bottom: 26px;
}

.pl-small-pill span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
}

.pl-heading h2 {
  margin: 0;
  font-size: clamp(54px, 6vw, 84px);
  line-height: 0.92;
  letter-spacing: -0.06em;
}

.pl-heading h2 span {
  color: #16a34a;
}

.pl-kpis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.pl-kpis div,
.pl-breakdown div {
  background: #effcf3;
  border: 1px solid #d6f7df;
  border-radius: 18px;
  padding: 20px;
}

.pl-kpis span,
.pl-breakdown span {
  display: block;
  color: #087b38;
  font-weight: 800;
  margin-bottom: 8px;
}

.pl-kpis strong,
.pl-breakdown strong {
  font-size: 26px;
}

.pl-table-card {
  background: #ffffff;
  border: 1px solid #e5eaf0;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
  overflow-x: auto;
}

.pl-table-card table {
  width: 100%;
  border-collapse: collapse;
  min-width: 620px;
}

.pl-table-card th,
.pl-table-card td {
  padding: 15px 12px;
  border-bottom: 1px solid #e9edf2;
  text-align: left;
  vertical-align: top;
}

.pl-table-card th {
  color: #697386;
  font-size: 14px;
}

.pl-table-card td:first-child {
  font-weight: 900;
  color: #1f2937;
}

.pl-table-card td {
  font-weight: 800;
}

.sum td {
  background: #f8fafc;
}

.pos {
  color: #15803d !important;
}

.neg {
  color: #dc2626 !important;
}

.net td {
  border-bottom: 0;
  font-size: 18px;
  background: #effcf3;
}

.net td:first-child {
  border-radius: 14px 0 0 14px;
}

.net td:last-child {
  border-radius: 0 14px 14px 0;
}

.pl-breakdown {
  margin-top: 22px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

@media (max-width: 1100px) {
  .bringo-pl {
    grid-template-columns: 1fr;
  }

  .pl-kpis,
  .pl-breakdown {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 700px) {
  .pl-left,
  .pl-right {
    padding: 26px;
  }

  .pl-pair,
  .pl-control-grid,
  .pl-kpis,
  .pl-breakdown {
    grid-template-columns: 1fr;
  }

  .pl-topbar {
    justify-content: space-between;
    margin-bottom: 30px;
  }

  .pl-heading h2,
  .pl-left h1 {
    font-size: 46px;
  }
}
`;

