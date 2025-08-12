import { useState } from 'react'
import './App.css'

function App() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');

  const handleUpload = async () => {
    if (!file) return alert('Please select a file');
    const formData = new FormData();
    formData.append('csvfile', file);

    try {
      const res = await fetch('http://localhost:4000/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setStatus(data.message || 'Upload complete');
    } catch (err) {
      console.log(err);
      setStatus('Upload failed');
    }
  };

  return (
    <div>
      <h2>Upload CSV with Image URLs</h2>
      <input type="file" accept=".csv" onChange={e => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload</button>
      <p>{status}</p>
    </div>
  );
}

export default App;