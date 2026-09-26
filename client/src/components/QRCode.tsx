import { QRCodeSVG } from 'qrcode.react';

export default function QRCode({ url }: { url: string }) {
  return (
    <div className="qr-container">
      <div className="qr-label">SCAN TO PLAY</div>
      <div style={{ background: 'white', padding: '16px', borderRadius: '8px' }}>
        <QRCodeSVG 
          value={url} 
          size={256}
          bgColor={"#ffffff"}
          fgColor={"#000000"}
          level={"H"}
          includeMargin={false}
        />
      </div>
      <div style={{ color: 'black', fontFamily: 'var(--font-heading)' }}>{url.replace('http://', '').replace('https://', '')}</div>
    </div>
  );
}
