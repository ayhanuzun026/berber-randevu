import './LoadingSpinner.css';

export default function LoadingSpinner({ text = 'Yükleniyor...' }) {
  return (
    <div className="spinner">
      <div className="spinner__emblem">
        <span className="spinner__ring" />
        <img src="/esspor.svg" alt="" className="spinner__logo" />
      </div>
      {text && <p className="spinner__text">{text}</p>}
    </div>
  );
}
