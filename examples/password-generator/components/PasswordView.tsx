import React, { useCallback, useEffect, useRef, useState } from 'react';
import { generate } from '../utils/generator';
import { calculateStrength, formatEntropy, estimateCrackTime } from '../utils/strength';
import { parsePasswordQuery } from '../parsers/queryParser';
import { GeneratedPassword, PasswordMode, MODE_CONFIGS } from '../types';
import './PasswordView.css';

// Helper provided by Volt runtime
const copyToClipboard = (text: string): boolean => {
  // In Volt, this uses native clipboard API
  console.log('Copy to clipboard:', text);
  return true;
};

interface PasswordViewProps {
  onClose: () => void;
  initialQuery?: string;
}

export const PasswordView: React.FC<PasswordViewProps> = ({
  onClose,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [generated, setGenerated] = useState<GeneratedPassword | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Generate password when query changes
  useEffect(() => {
    const parsed = parsePasswordQuery(query || 'pass');

    if (parsed) {
      try {
        const result = generate(
          parsed.mode,
          parsed.mode === 'phrase' ? parsed.wordCount : parsed.length,
          parsed.separator
        );
        setGenerated(result);
        setCopied(false);
      } catch (error) {
        console.error('Generation error:', error);
        setGenerated(null);
      }
    }
  }, [query]);

  // Regenerate with same settings
  const handleRegenerate = useCallback(() => {
    const parsed = parsePasswordQuery(query || 'pass');
    if (parsed) {
      const result = generate(
        parsed.mode,
        parsed.mode === 'phrase' ? parsed.wordCount : parsed.length,
        parsed.separator
      );
      setGenerated(result);
      setCopied(false);
    }
  }, [query]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!generated) return;

    const success = await copyToClipboard(generated.value);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [generated]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter' && generated) {
        e.preventDefault();
        handleCopy();
      } else if (e.key === 'r' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleRegenerate();
      }
    },
    [generated, onClose, handleCopy, handleRegenerate]
  );

  // Quick mode buttons
  const handleQuickMode = (mode: PasswordMode) => {
    const config = MODE_CONFIGS[mode];
    if (mode === 'phrase') {
      setQuery(`pass phrase ${config.defaultLength}`);
    } else if (mode === 'pin') {
      setQuery(`pass pin ${config.defaultLength}`);
    } else {
      setQuery(`pass ${mode}`);
    }
  };

  const strengthInfo = generated ? calculateStrength(generated.entropy) : null;

  return (
    <div className="password-view" onKeyDown={handleKeyDown}>
      {/* Header */}
      <div className="password-header">
        <button className="back-button" onClick={onClose} aria-label="Back">
          ←
        </button>
        <span className="password-title">Password Generator</span>
      </div>

      {/* Content */}
      <div className="password-content">
        {/* Input Section */}
        <div className="password-input-section">
          <input
            ref={inputRef}
            type="text"
            className="password-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="pass, pass strong, pass phrase 6, pass pin..."
            spellCheck={false}
            autoFocus
          />
        </div>

        {/* Generated Password Display */}
        {generated && (
          <div className="password-result">
            <div className="password-value-container">
              <div
                className="password-value"
                style={{ fontFamily: 'monospace' }}
              >
                {generated.value}
              </div>
              <button
                className={`copy-button ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
                title="Copy (Enter)"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>

            {/* Strength Indicator */}
            <div className="password-strength">
              <div className="strength-bar-container">
                <div
                  className="strength-bar"
                  style={{
                    width: `${strengthInfo?.score ?? 0}%`,
                    backgroundColor: strengthInfo?.color ?? '#888',
                  }}
                />
              </div>
              <div className="strength-info">
                <span
                  className="strength-label"
                  style={{ color: strengthInfo?.color }}
                >
                  {strengthInfo?.label}
                </span>
                <span className="strength-entropy">
                  {formatEntropy(generated.entropy)}
                </span>
              </div>
              <div className="crack-time">
                Temps de crack: {estimateCrackTime(generated.entropy)}
              </div>
            </div>

            {/* Regenerate Button */}
            <button
              className="regenerate-button"
              onClick={handleRegenerate}
              title="Regenerate (Ctrl+R)"
            >
              Regenerate
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="password-quick-actions">
          <button
            className={`quick-action ${generated?.mode === 'default' ? 'active' : ''}`}
            onClick={() => handleQuickMode('default')}
          >
            <span className="quick-action-label">Standard</span>
          </button>
          <button
            className={`quick-action ${generated?.mode === 'strong' ? 'active' : ''}`}
            onClick={() => handleQuickMode('strong')}
          >
            <span className="quick-action-label">Strong</span>
          </button>
          <button
            className={`quick-action ${generated?.mode === 'simple' ? 'active' : ''}`}
            onClick={() => handleQuickMode('simple')}
          >
            <span className="quick-action-label">Simple</span>
          </button>
          <button
            className={`quick-action ${generated?.mode === 'phrase' ? 'active' : ''}`}
            onClick={() => handleQuickMode('phrase')}
          >
            <span className="quick-action-label">Phrase</span>
          </button>
          <button
            className={`quick-action ${generated?.mode === 'pin' ? 'active' : ''}`}
            onClick={() => handleQuickMode('pin')}
          >
            <span className="quick-action-label">PIN</span>
          </button>
        </div>

        {/* Mode Description */}
        {generated && (
          <div className="mode-description">
            {MODE_CONFIGS[generated.mode].description}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="password-footer">
        <div className="footer-hint">
          <kbd>Enter</kbd> Copier
        </div>
        <div className="footer-hint">
          <kbd>Ctrl+R</kbd> Régénérer
        </div>
        <div className="footer-hint">
          <kbd>Esc</kbd> Fermer
        </div>
      </div>
    </div>
  );
};
