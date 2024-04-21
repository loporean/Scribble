import { createContext } from "react";

export const initValueContext = createContext();

function InitValue(props) {
    const [initValue, setInitValue] = [];
    return (
        <InitValue.Provider value={{initValue, setInitValue}}>{props.children}</InitValue.Provider>
    );
}

export default InitValue;