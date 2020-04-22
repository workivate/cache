import * as exec from "@actions/exec";
import * as io from "@actions/io";
import * as path from "path";

import { CacheFilename } from "../src/constants";
import * as tar from "../src/tar";

import fs = require("fs");

jest.mock("@actions/exec");
jest.mock("@actions/io");

const IS_WINDOWS = process.platform === "win32";

function getTempDir(): string {
    return path.join(__dirname, "_temp", "tar");
}

beforeAll(async () => {
    jest.spyOn(io, "which").mockImplementation(tool => {
        return Promise.resolve(tool);
    });

    process.env["GITHUB_WORKSPACE"] = process.cwd();
    await jest.requireActual("@actions/io").rmRF(getTempDir());
});

afterAll(async () => {
    delete process.env["GITHUB_WORKSPACE"];
    await jest.requireActual("@actions/io").rmRF(getTempDir());
});

test("zstd extract tar", async () => {
    const zstdMock = jest
        .spyOn(tar, "useZstd")
        .mockReturnValue(Promise.resolve(true));
    const mkdirMock = jest.spyOn(io, "mkdirP");
    const execMock = jest.spyOn(exec, "exec");

    const archivePath = IS_WINDOWS
        ? `${process.env["windir"]}\\fakepath\\cache.tar`
        : "cache.tar";
    const workspace = process.env["GITHUB_WORKSPACE"];

    await tar.extractTar(archivePath);

    expect(zstdMock).toHaveBeenCalledTimes(1);
    expect(mkdirMock).toHaveBeenCalledWith(workspace);
    const tarPath = IS_WINDOWS
        ? `${process.env["windir"]}\\System32\\tar.exe`
        : "tar";
    expect(execMock).toHaveBeenCalledTimes(1);
    expect(execMock).toHaveBeenCalledWith(
        `${tarPath}`,
        [
            "-x",
            `--use-compress-program="zstd -d"`,
            "-f",
            IS_WINDOWS ? archivePath.replace(/\\/g, "/") : archivePath,
            "-P",
            "-C",
            IS_WINDOWS ? workspace?.replace(/\\/g, "/") : workspace
        ],
        { cwd: undefined }
    );
});

test("gzip extract tar", async () => {
    const zstdMock = jest
        .spyOn(tar, "useZstd")
        .mockReturnValue(Promise.resolve(false));
    const mkdirMock = jest.spyOn(io, "mkdirP");
    const execMock = jest.spyOn(exec, "exec");
    const archivePath = IS_WINDOWS
        ? `${process.env["windir"]}\\fakepath\\cache.tar`
        : "cache.tar";
    const workspace = process.env["GITHUB_WORKSPACE"];

    await tar.extractTar(archivePath);

    expect(zstdMock).toHaveBeenCalledTimes(1);
    expect(mkdirMock).toHaveBeenCalledWith(workspace);
    const tarPath = IS_WINDOWS
        ? `${process.env["windir"]}\\System32\\tar.exe`
        : "tar";
    expect(execMock).toHaveBeenCalledTimes(1);
    expect(execMock).toHaveBeenCalledWith(
        `${tarPath}`,
        [
            "-x",
            "-z",
            "-f",
            IS_WINDOWS ? archivePath.replace(/\\/g, "/") : archivePath,
            "-P",
            "-C",
            IS_WINDOWS ? workspace?.replace(/\\/g, "/") : workspace
        ],
        { cwd: undefined }
    );
});

test("gzip extract GNU tar on windows", async () => {
    if (IS_WINDOWS) {
        jest.spyOn(fs, "existsSync").mockReturnValueOnce(false);
        const zstdMock = jest
            .spyOn(tar, "useZstd")
            .mockReturnValue(Promise.resolve(false));
        const isGnuMock = jest
            .spyOn(tar, "useGnuTar")
            .mockReturnValue(Promise.resolve(true));

        const execMock = jest.spyOn(exec, "exec");
        const archivePath = `${process.env["windir"]}\\fakepath\\cache.tar`;
        const workspace = process.env["GITHUB_WORKSPACE"];

        await tar.extractTar(archivePath);

        expect(zstdMock).toHaveBeenCalledTimes(1);
        expect(isGnuMock).toHaveBeenCalledTimes(1);
        expect(execMock).toHaveBeenCalledTimes(1);
        expect(execMock).toHaveBeenCalledWith(
            `tar`,
            [
                "-x",
                "-z",
                "-f",
                archivePath.replace(/\\/g, "/"),
                "-P",
                "-C",
                workspace?.replace(/\\/g, "/"),
                "--force-local"
            ],
            { cwd: undefined }
        );
    }
});

test("zstd create tar", async () => {
    const zstdMock = jest
        .spyOn(tar, "useZstd")
        .mockReturnValue(Promise.resolve(true));
    const execMock = jest.spyOn(exec, "exec");

    const archiveFolder = getTempDir();
    const workspace = process.env["GITHUB_WORKSPACE"];
    const sourceDirectories = ["~/.npm/cache", `${workspace}/dist`];

    await fs.promises.mkdir(archiveFolder, { recursive: true });

    await tar.createTar(archiveFolder, sourceDirectories);

    const tarPath = IS_WINDOWS
        ? `${process.env["windir"]}\\System32\\tar.exe`
        : "tar";

    expect(zstdMock).toHaveBeenCalledTimes(1);
    expect(execMock).toHaveBeenCalledTimes(1);
    expect(execMock).toHaveBeenCalledWith(
        `${tarPath}`,
        [
            "-c",
            `--use-compress-program="zstd -T0"`,
            "-f",
            IS_WINDOWS ? CacheFilename.replace(/\\/g, "/") : CacheFilename,
            "-P",
            "-C",
            IS_WINDOWS ? workspace?.replace(/\\/g, "/") : workspace,
            "--files-from",
            "manifest.txt"
        ],
        {
            cwd: archiveFolder
        }
    );
});

test("gzip create tar", async () => {
    const zstdMock = jest
        .spyOn(tar, "useZstd")
        .mockReturnValue(Promise.resolve(false));
    const execMock = jest.spyOn(exec, "exec");

    const archiveFolder = getTempDir();
    const workspace = process.env["GITHUB_WORKSPACE"];
    const sourceDirectories = ["~/.npm/cache", `${workspace}/dist`];

    await fs.promises.mkdir(archiveFolder, { recursive: true });

    await tar.createTar(archiveFolder, sourceDirectories);

    const tarPath = IS_WINDOWS
        ? `${process.env["windir"]}\\System32\\tar.exe`
        : "tar";

    expect(zstdMock).toHaveBeenCalledTimes(1);
    expect(execMock).toHaveBeenCalledTimes(1);
    expect(execMock).toHaveBeenCalledWith(
        `${tarPath}`,
        [
            "-c",
            "-z",
            "-f",
            IS_WINDOWS ? CacheFilename.replace(/\\/g, "/") : CacheFilename,
            "-P",
            "-C",
            IS_WINDOWS ? workspace?.replace(/\\/g, "/") : workspace,
            "--files-from",
            "manifest.txt"
        ],
        {
            cwd: archiveFolder
        }
    );
});
