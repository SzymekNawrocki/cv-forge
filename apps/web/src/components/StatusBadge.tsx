const statusMap: Record<string, { bg: string; text: string; border: string }> = {
  new:      { bg: 'rgba(96,165,250,0.09)',  text: '#7BB8F8', border: 'rgba(96,165,250,0.22)'  },
  reviewed: { bg: 'rgba(255,140,66,0.09)',  text: '#FF8C42', border: 'rgba(255,140,66,0.22)'  },
  applied:  { bg: 'rgba(74,222,128,0.09)',  text: '#4ADE80', border: 'rgba(74,222,128,0.22)'  },
  rejected: { bg: 'rgba(248,113,113,0.09)', text: '#F87171', border: 'rgba(248,113,113,0.22)' },
};

export function StatusBadge({ status }: { status: string }) {
  const s = statusMap[status] ?? { bg: 'rgba(255,255,255,0.05)', text: '#7A7A84', border: '#272729' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 9px',
      background: s.bg,
      border: `1px solid ${s.border}`,
      borderRadius: '4px',
      fontFamily: '"Barlow Condensed", sans-serif',
      fontSize: '11px',
      fontWeight: 700,
      letterSpacing: '0.10em',
      textTransform: 'uppercase',
      color: s.text,
      whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  );
}
