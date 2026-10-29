import { createHashRouter, Navigate, Outlet } from "react-router-dom";
import { routesDefinition } from "./routesDefinition";
import Layout from "@/layout/wrapper";
import { PropsWithChildren } from "react";
import { useQlik } from "@cluster-data-experience/qlik-modules";
import { DisconnectionDialog } from "@/components/DisconnectionDialog/DisconnectionDialog";

// O módulo exporta o router (não é componente): editar as rotas recarrega a página, e isso é o esperado
// eslint-disable-next-line react-refresh/only-export-components
const ConnectionGuard = ({ children }: PropsWithChildren) => {
  const { sessionState, loading } = useQlik();

  // "disconnected" é também o estado inicial da lib: só conta depois de conectar (loading false),
  // quando significa que o socket fechou (rede caiu, máquina dormiu) e a lib não religa sozinha
  const desconectado = sessionState === "timedOut" || (sessionState === "disconnected" && !loading);
  return (
    <>
      {children}
      <DisconnectionDialog disconnected={desconectado} />
    </>
  );
};

const defaultPath = routesDefinition[0].href;

// Data router, não o <HashRouter> declarativo: só o RouterProvider honra `viewTransition` nas navegações.
export const router = createHashRouter([
  {
    path: "/",
    element: <Navigate to={defaultPath} replace />,
  },
  {
    path: "/",
    element: (
      <ConnectionGuard>
        <Layout>
          <Outlet />
        </Layout>
      </ConnectionGuard>
    ),
    children: [
      ...routesDefinition.map(({ href, element }) => ({ path: href, element })),
    ],
  },
  {
    path: "*",
    element: <Navigate to={defaultPath} replace />,
  },
]);
