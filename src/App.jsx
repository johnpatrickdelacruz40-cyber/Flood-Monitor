useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await fetch('https://flood-monitor-seven.vercel.app/api/flood', { 
        cache: 'no-store' 
      });
      const data = await response.json();
      if (data.latest) setFloodData(data.latest);
      if (data.history) setHistory(data.history);
    } catch (e) { console.error("Sync Error"); }
  };
  const interval = setInterval(fetchData, 2000);
  return () => clearInterval(interval);
}, []);