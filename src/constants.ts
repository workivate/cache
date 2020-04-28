export enum Inputs {
    Key = "key",
    Path = "path",
    RestoreKeys = "restore-keys"
}

export enum Outputs {
    CacheHit = "cache-hit"
}

export enum State {
    CacheKey = "CACHE_KEY",
    CacheResult = "CACHE_RESULT"
}

export enum Events {
    Key = "GITHUB_EVENT_NAME",
    Push = "push",
    PullRequest = "pull_request"
}

export enum CacheFilename {
    Gzip = "cache.tgz",
    Zstd = "cache.tzst"
}

export enum CompressionMethod {
    Gzip = "gzip",
    Zstd = "zstd"
}
