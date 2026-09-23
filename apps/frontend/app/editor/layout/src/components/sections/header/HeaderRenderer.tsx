import HeaderOne from "./HeaderOne";
import HeaderTwo from "./HeaderTwo";
import { SectionProps } from "./../../../types/section";

type HeaderRendererProps = {
  variant: string;
  data: SectionProps["data"];
};

export default function HeaderRenderer({
  variant,
  data,
}: HeaderRendererProps) {
  const headers: Record<
    string,
    React.ComponentType<Pick<SectionProps, "data">>
  > = {
    "header-1": HeaderOne,
    "header-2": HeaderTwo,
  };

  const HeaderComponent = headers[variant] ?? HeaderOne;

  return <HeaderComponent data={data} />;
}