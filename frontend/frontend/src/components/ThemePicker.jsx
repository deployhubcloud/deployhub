import { useRef } from "react";
import { themes } from "../theme";
import useTheme from "../hooks/useTheme";
import { Icon } from "./ui";

export default function ThemePicker() {
  const dialog = useRef(null);
  const { theme, setTheme } = useTheme();
  return (
    <>
      <button
        className="theme-trigger"
        onClick={() => dialog.current.showModal()}
        aria-label={`Choose theme, current theme ${theme.name}`}
        aria-haspopup="dialog"
      >
        <Icon name="palette" size={17} />
        <span>Theme</span>
        <span className="theme-dot" />
      </button>
      <dialog
        ref={dialog}
        className="theme-dialog"
        aria-labelledby="theme-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current.close();
        }}
      >
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">MAKE YOURSELF AT HOME</span>
            <h2 id="theme-title">A little more you.</h2>
            <p>The same quiet palettes as your dashboard.</p>
          </div>
          <button
            autoFocus
            className="icon-button"
            aria-label="Close themes"
            onClick={() => dialog.current.close()}
          >
            <Icon name="close" />
          </button>
        </div>
        <fieldset className="theme-grid">
          <legend className="sr-only">Choose a theme</legend>
          {themes.map((option) => (
            <label
              className={`theme-option ${theme.id === option.id ? "selected" : ""}`}
              key={option.id}
            >
              <input
                type="radio"
                name="appearance"
                value={option.id}
                checked={theme.id === option.id}
                onChange={() => setTheme(option)}
              />
              <span
                className="palette-preview"
                style={{ background: option.colors.bg }}
              >
                <i style={{ background: option.colors.surface }} />
                <i style={{ background: option.colors.tint }} />
                <i style={{ background: option.colors.accent }} />
              </span>
              <span className="theme-name">
                {option.name}
                {theme.id === option.id && <Icon name="check" size={14} />}
              </span>
              <small>{option.description}</small>
            </label>
          ))}
        </fieldset>
        <p className="dialog-note">
          Your preference is saved in this browser. Slate is the default.
        </p>
      </dialog>
    </>
  );
}
