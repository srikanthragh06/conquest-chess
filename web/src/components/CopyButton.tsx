import { useState } from "react";
import { FaClipboard } from "react-icons/fa";
import { FaClipboardCheck } from "react-icons/fa";
import { CopyToClipboard } from "react-copy-to-clipboard";

const CopyButton = ({
    className = "",
    text,
}: {
    className?: string;
    text: string;
}) => {
    const [isCopied, setIsCopied] = useState(false);

    return (
        <CopyToClipboard text={text} onCopy={() => setIsCopied(true)}>
            {isCopied ? (
                <FaClipboardCheck
                    className={`cursor-pointer text-zinc-200 hover:text-zinc-50 ${className}`}
                />
            ) : (
                <FaClipboard
                    className={`cursor-pointer text-zinc-200 hover:text-zinc-50 ${className}`}
                />
            )}
        </CopyToClipboard>
    );
};

export default CopyButton;
