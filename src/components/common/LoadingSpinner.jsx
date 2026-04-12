import './LoadingSpinner.css';

export default function LoadingSpinner({ text = 'Yükleniyor...' }) {
  return (
    <div className="spinner">
      <div className="spinner__circle" />
      <p className="spinner__text">{text}</p>
    </div>
  );
}
