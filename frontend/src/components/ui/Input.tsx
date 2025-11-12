import React, { useId, forwardRef } from 'react';
import styles from './css/input.module.css';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, error, ...rest }, ref) {
  const autoId = useId();
  const inputId = rest.id || (rest.name ? `${rest.name}-input` : autoId);
  return (
    <div className={styles.field}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <input
        {...rest}
        id={inputId}
        aria-invalid={!!error}
        ref={ref}
        className={`${styles.input} ${error ? styles.inputError : ''} ${rest.className || ''}`}
      />
      {error && (
        <small className={styles.errorText}>{error}</small>
      )}
    </div>
  );
});

export default Input;