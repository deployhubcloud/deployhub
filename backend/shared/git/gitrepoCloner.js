import { execSync } from "child_process";

export class GitCloner {

    static clone({
        repoUrl,
        branch,
        targetPath,
        githubToken,
        folderName
    }) {

        const repoUrlWithAuth = githubToken
            ? repoUrl.replace(
                "https://github.com/",
                `https://${githubToken}@github.com/`
            )
            : repoUrl;

        if (folderName?.trim()) {

            execSync(
                `git clone -b ${branch} --filter=blob:none --sparse ${repoUrlWithAuth} ${targetPath}`,
                {
                    stdio: "inherit",
                    shell: false
                }
            );

            execSync(
                `git -C ${targetPath} sparse-checkout set ${folderName}`,
                {
                    stdio: "inherit",
                    shell: false
                }
            );

        } else {

            execSync(
                `git clone -b ${branch} ${repoUrlWithAuth} ${targetPath}`,
                {
                    stdio: "inherit",
                    shell: false
                }
            );
        }
    }
}