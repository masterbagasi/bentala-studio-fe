import { Body, CardTitle } from "./Typography";

interface Props {
  number: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  className?: string;
}

export function NumberedCard({ number, title, description, icon, className }: Props) {
  return (
    <div className={className}>
      {icon && <div className="mb-5">{icon}</div>}

      <CardTitle className="mb-7">{title}</CardTitle>

      <Body className="!text-[20px] leading-[1.85]">{description}</Body>
    </div>
  );
}
