import { ReactNode } from "react";

const FormError = ({ children }: { children?: ReactNode }) => {
    return <p className="text-red-600 text-base">{children}</p>;
};

export default FormError;
