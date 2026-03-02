import React from 'react';

export default function NetWorth({ data, onChange }) {
  return (
    <div>
      <h2>Current Net Worth Baseline</h2>
      <InputField label="Liquid Assets ($)" value={data.liquidAssets} onChange={(e) => onChange('liquidAssets', e.target.value)} />
      <InputField label="Real Estate ($)" value={data.realEstate} onChange={(e) => onChange('realEstate', e.target.value)} />
      <InputField label="Liabilities ($)" value={data.liabilities} onChange={(e) => onChange('liabilities', e.target.value)} />
    </div>
  );
}

function InputField({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: '15px' }}>
      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>{label}</label>
      <input type="number" value={value} onChange={onChange} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
    </div>
  );
}