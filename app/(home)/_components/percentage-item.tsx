import { ReactNode } from "react";

interface PercentageItemProps {
  value: number;
  title: string;
  icon: ReactNode;
}

const PercentageItem = ({ value, title, icon }: PercentageItemProps) => {
  return (
    <div className="flex items-center justify-between">
      {/* ÍCONE */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-white bg-opacity-[3%]">{icon}</div>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
      {/* PORCENTAGEM */}
      <p className="text-sm font-bold">{value}%</p>
    </div>
  );
};

export default PercentageItem;
