import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { LegalHero, LegalBody } from '../components/LegalDocument';

export default function Privacidad() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/content')
      .then((r) => r.json())
      .then((data) => setContent(data?.privacy || {}))
      .catch(() => setContent({}))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Navbar />
      <LegalHero title="Aviso de Privacidad" lastUpdated={content?.last_updated} />
      <LegalBody intro={content?.intro} body={content?.body} loading={loading} />
      <Footer />
    </div>
  );
}
