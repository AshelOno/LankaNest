import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConfigProvider, App as AntdApp } from "antd";
import "antd/dist/reset.css";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#0a4174",
          colorInfo: "#0a4174",
          colorSuccess: "#0f8b6f",
          colorWarning: "#d7b35a",
          colorError: "#df5267",
          colorText: "#0b172a",
          colorTextSecondary: "#5e6b7e",
          colorBorder: "#d8e2f1",
          colorBgLayout: "#f3f7fd",
          colorBgContainer: "#fbfdff",
          borderRadius: 8,
          controlHeight: 38,
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        },
        components: {
          Button: {
            borderRadius: 8,
            controlHeight: 38,
            fontWeight: 700,
            primaryShadow: "0 14px 28px rgba(10, 65, 116, 0.22)",
          },
          Card: {
            borderRadiusLG: 8,
            paddingLG: 18,
            boxShadowTertiary: "0 18px 46px -16px rgba(10, 65, 116, 0.22)",
          },
          Input: {
            borderRadius: 8,
            activeShadow: "0 0 0 4px rgba(10, 65, 116, 0.12)",
          },
          Select: {
            borderRadius: 8,
            optionSelectedBg: "#e8f7f1",
          },
          Table: {
            borderColor: "#d8e2f1",
            headerBg: "#eef4ff",
            headerColor: "#4b5563",
            rowHoverBg: "#f3f7fd",
          },
          Tag: {
            borderRadiusSM: 6,
            fontSizeSM: 12,
          },
        },
      }}
    >
      <AntdApp>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <App />
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  </StrictMode>
);
