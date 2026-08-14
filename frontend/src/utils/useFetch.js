import { useEffect, useState } from 'react';

export default function useFetch(url, opts) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
	let mounted = true;
	fetch(url, opts).then(r=>r.json()).then(j=>{ if(mounted) { setData(j); setLoading(false); } }).catch(()=>{ if(mounted) setLoading(false); });
	return () => { mounted = false; };
  }, [url]);
  return { data, loading };
}
