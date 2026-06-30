export const typeLangVersionSelector = (type, version) => {
    const images = {
        static: `node:${version}`,
        node: `node:${version}`,
        go: `golang:${version}`,
        python: `python:${version}`,
        java: `java:${version}`,
    }

    return images[type]
}