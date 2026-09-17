export const Input = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  ...props
}) => {
  return (
    <div className="coss-form-group">
      {label && (
        <label htmlFor={id} className="coss-label">
          {label} {required && <span style={{ color: 'var(--accent-rose)' }}>*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`coss-input ${error ? 'error' : ''}`}
        {...props}
      />
      {error && <span className="coss-error-text">{error}</span>}
    </div>
  );
};
