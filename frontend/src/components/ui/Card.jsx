export const Card = ({ children, className = '', ...props }) => {
  return (
    <div className={`coss-card ${className}`} {...props}>
      {children}
    </div>
  );
};
