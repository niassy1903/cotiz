import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const legacyMockDataPrefix = 'cotiz_data_v1_';
Object.keys(localStorage).forEach((key) => {
  if (key.startsWith(legacyMockDataPrefix)) localStorage.removeItem(key);
});

createRoot(document.getElementById('root')!).render(<App />);
