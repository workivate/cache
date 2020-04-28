import { getCacheVersion } from "../src/cacheHttpClient";
import { Inputs } from "../src/constants";
import * as testUtils from "../src/utils/testUtils";

afterEach(() => {
    testUtils.clearInputs();
});

test("getCacheVersion with path input and useZstd undefined returns version", async () => {
    testUtils.setInput(Inputs.Path, "node_modules");

    const result = getCacheVersion();

    expect(result).toEqual(
        "b3e0c6cb5ecf32614eeb2997d905b9c297046d7cbf69062698f25b14b4cb0985"
    );
});

test("getCacheVersion with zstd compression returns version", async () => {
    testUtils.setInput(Inputs.Path, "node_modules");
    const useZstd = true;
    const result = getCacheVersion(useZstd);

    expect(result).toEqual(
        "273877e14fd65d270b87a198edbfa2db5a43de567c9a548d2a2505b408befe24"
    );
});

test("getCacheVersion with gzip compression does not change vesion", async () => {
    testUtils.setInput(Inputs.Path, "node_modules");
    const useZstd = false;
    const result = getCacheVersion(useZstd);

    expect(result).toEqual(
        "b3e0c6cb5ecf32614eeb2997d905b9c297046d7cbf69062698f25b14b4cb0985"
    );
});

test("getCacheVersion with no input throws", async () => {
    expect(() => getCacheVersion()).toThrow();
});
