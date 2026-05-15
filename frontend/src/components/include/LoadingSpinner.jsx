import { motion } from "framer-motion";
import PropTypes from "prop-types";
import { Loader2 } from "lucide-react";

const LoadingSpinner = ({
  label = "Preparing LankaNest",
  detail = "Loading trusted student housing tools.",
  fullscreen = true,
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`ln-page-surface flex items-center justify-center px-4 text-center ${
        fullscreen ? "min-h-screen" : "min-h-[16rem] rounded-lg"
      }`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-amber-100 bg-white p-3 shadow-lux">
          <img src="/lankanestLogo.png" alt="LankaNest" className="h-full w-full object-contain" />
        </div>

        <Loader2 className="mt-5 h-6 w-6 animate-spin text-emerald-700" aria-hidden="true" />
        <p className="mt-3 text-sm font-bold text-slate-900">{label}</p>
        <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">{detail}</p>

        <span className="sr-only">
          {label}. {detail}
        </span>
      </motion.div>
    </div>
  );
};

LoadingSpinner.propTypes = {
  label: PropTypes.string,
  detail: PropTypes.string,
  fullscreen: PropTypes.bool,
};

export const InlineLoader = ({ label = "Loading", detail = "Please wait while LankaNest prepares this view." }) => {
  return (
    <div className="rounded-lg border border-amber-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-emerald-700" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-950">{label}</p>
          <p className="mt-0.5 text-xs leading-5 text-slate-500">{detail}</p>
        </div>
      </div>
    </div>
  );
};

InlineLoader.propTypes = {
  label: PropTypes.string,
  detail: PropTypes.string,
};

export const MapInlineLoader = ({ label = "Loading map", detail = "Placing listings and campus markers." }) => {
  return (
    <div className="rounded-lg border border-amber-100 bg-white px-4 py-3 text-left shadow-sm">
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-emerald-700" />
        <div>
          <p className="text-sm font-bold text-slate-950">{label}</p>
          <p className="mt-0.5 text-xs font-medium text-slate-500">{detail}</p>
        </div>
      </div>
    </div>
  );
};

MapInlineLoader.propTypes = {
  label: PropTypes.string,
  detail: PropTypes.string,
};

export default LoadingSpinner;
