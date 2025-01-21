import React from "react";

type FormInputProps = {
    className?: string;
    placeholder?: string;
    inputState: string;
    setInputState: React.Dispatch<React.SetStateAction<string>>;
    type?: string;
};

const FormInput = ({
    inputState,
    setInputState,
    className = "",
    placeholder = "",
    type = "text",
}: FormInputProps) => {
    return (
        <input
            type={type}
            value={inputState}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setInputState(e.target.value)
            }
            placeholder={placeholder}
            className={` bg-gray-800 outline-none rounded-md text-white text-lg p-1 ${className}`}
        />
    );
};

export default FormInput;
