import { useState } from "react";

export default function DumpMemoryButton({ memoryData }) {
    const [copied, setCopied] = useState(false);


    const dumpToMemory = () => {

        // memory is int[] for each byte, combine every 4 
        let output = "";


        for (let i = 0; i < memoryData.length; i += 4) {
            let val = (memoryData[i] << 24) | (memoryData[i + 1] << 16) | (memoryData[i + 2] << 8) | (memoryData[i + 3]);
            val >>>= 0;

            let indexPadded = String(i).padStart(4, "0");

            const formatted = `${indexPadded}:`.padEnd(4) + String(val).padStart(10);

            output += formatted + "\n";
        }

        navigator.clipboard.writeText(output)
            .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500)
            });
    }

    return (
        <button onClick={dumpToMemory} id="save_button" style={{ marginRight: "0.50rem", height: "2rem" }} className={copied ? "copied-button" : "primary-button"}>{ copied ? "Copied!" : "Dump Memory to Clipboard" }</button>
    )
}