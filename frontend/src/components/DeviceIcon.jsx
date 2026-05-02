import {
  Monitor,
  Laptop,
  Router,
  Camera,
  Server,
  Smartphone,
  Printer,
  HelpCircle,
} from 'lucide-react';

const TYPE_CONFIG = {
  PC:       { Icon: Monitor,     color: '#00d4ff', label: 'PC' },
  Laptop:   { Icon: Laptop,      color: '#00d4ff', label: 'Laptop' },
  Router:   { Icon: Router,      color: '#ffb300', label: 'Router' },
  Camera:   { Icon: Camera,      color: '#ff4560', label: 'Camera' },
  Server:   { Icon: Server,      color: '#a78bfa', label: 'Server' },
  Phone:    { Icon: Smartphone,  color: '#34d399', label: 'Phone' },
  Printer:  { Icon: Printer,     color: '#fb923c', label: 'Printer' },
  Unknown:  { Icon: HelpCircle,  color: '#4a6080', label: 'Unknown' },
};

export default function DeviceIcon({ type, size = 16 }) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.Unknown;
  const { Icon, color } = config;

  return (
    <span
      className="inline-flex items-center justify-center rounded"
      style={{ color }}
      title={type}
    >
      <Icon size={size} strokeWidth={1.5} />
    </span>
  );
}

export { TYPE_CONFIG };
