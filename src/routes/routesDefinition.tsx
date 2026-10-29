import type { ReactElement } from "react";
import { HardHat, LayoutDashboard, Route, ScrollText, Wrench } from "lucide-react";
import { Contratos } from "@/pages/Contratos/Contratos";
import { Entregas } from "@/pages/Entregas/Entregas";
import { Manutencao } from "@/pages/Manutencao/Manutencao";
import { Obras } from "@/pages/Obras/Obras";
import { VisaoGeral } from "@/pages/VisaoGeral/VisaoGeral";

export interface RouteDefinition {
  label: string;
  href: string;
  element: ReactElement;
  // Título do cabeçalho da página, quando difere do rótulo do menu
  titulo?: string;
  icon?: ReactElement;
  description?: string;
}

export const routesDefinition: RouteDefinition[] = [
  {
    label: "Visão geral",
    href: "/visao-geral",
    description: "A situação dos contratos e obras da SINFRA-MT hoje, com o que exige atenção.",
    element: <VisaoGeral />,
    icon: <LayoutDashboard size={16} />,
  },
  {
    label: "Contratos",
    href: "/contratos",
    description: "Quanto foi contratado, executado e pago; prazos, conformidade e necessidade de orçamento.",
    element: <Contratos />,
    icon: <ScrollText size={16} />,
  },
  {
    label: "Obras",
    href: "/obras",
    description: "Mapa, execução, alertas, garantia e paralisações das obras.",
    element: <Obras />,
    icon: <HardHat size={16} />,
  },
  {
    label: "Manutenção",
    href: "/manutencao",
    description: "Serviços de conservação e manutenção de rodovias por região.",
    element: <Manutencao />,
    icon: <Wrench size={16} />,
  },
  {
    label: "Entregas",
    href: "/entregas",
    description: "Quilômetros de pavimentação e restauração: situação, recebidos por ano e a lista das obras.",
    element: <Entregas />,
    icon: <Route size={16} />,
  },
];
