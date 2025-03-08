import { ReactNode } from "react";

const FormError = ({
    children,
    className,
}: {
    children?: ReactNode;
    className?: string;
}) => {
    return <p className={`text-red-600 text-sm ${className}`}>{children}</p>;
};

export default FormError;
