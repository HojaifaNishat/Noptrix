export default function Page() {
  const stats = [
    { label: 'Total Sales', value: '$24.8K' },
    { label: 'Orders', value: '1,420' },
    { label: 'Customers', value: '980' },
  ];

  return (
    <main style={{ minHeight: '100vh', background: '#f5f5f0', padding: '32px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#c96b43',
                fontWeight: 700,
                fontSize: '12px',
              }}
            >
              NOPTRIX
            </p>
            <h1 style={{ margin: '10px 0 0', fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}>
              Sample Page
            </h1>
          </div>
          <button
            style={{
              border: 'none',
              borderRadius: '999px',
              background: '#e46d45',
              color: 'white',
              padding: '12px 20px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            View Report
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          {stats.map((item) => (
            <div
              key={item.label}
              style={{
                background: '#fff',
                border: '1px solid #e5e5dc',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 10px 24px rgba(24, 37, 34, 0.05)',
              }}
            >
              <div
                style={{
                  color: '#6b7280',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {item.label}
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '8px' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        <section
          style={{
            background: '#fff',
            border: '1px solid #e5e5dc',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 10px 24px rgba(24, 37, 34, 0.05)',
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: '1.25rem' }}>Sample content</h2>
          <p style={{ color: '#4b5563', lineHeight: 1.7 }}>
            This page is a working placeholder for testing the frontend layout. You can replace the
            demo data with real API values, forms, and product cards for the final implementation.
          </p>
          <ul style={{ margin: '16px 0 0', paddingLeft: '20px', color: '#374151', lineHeight: 1.8 }}>
            <li>Admin dashboard widgets</li>
            <li>Store product listing layout</li>
            <li>Rider delivery progress panel</li>
            <li>Profile and support pages</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
