use anyhow::{anyhow, Result};
use std::process::Command;

fn run_git(args: &[&str]) -> Result<String> {
    let output = Command::new("git").args(args).output()?;
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        if stderr.is_empty() {
            Err(anyhow!("Git command failed"))
        } else {
            Err(anyhow!(stderr))
        }
    }
}

fn run_git_no_output(args: &[&str]) -> Result<()> {
    let output = Command::new("git").args(args).output()?;
    if output.status.success() {
        Ok(())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        if stderr.is_empty() {
            Err(anyhow!("Git command failed"))
        } else {
            Err(anyhow!(stderr))
        }
    }
}

pub fn latest_tag() -> Result<String> {
    run_git(&["describe", "--abbrev=0", "--tags"])
}

pub fn remote_origin_url() -> Result<String> {
    run_git(&["config", "--get", "remote.origin.url"])
}

pub fn commit_log_from_revision(revision: &str) -> String {
    let range = format!("{}..HEAD", revision);
    match run_git(&["log", "--format=%s %h", &range]) {
        Ok(output) => output,
        Err(_) => String::new(),
    }
}

pub fn create_tag(tag: &str, message: &str) -> Result<()> {
    run_git_no_output(&["tag", "-a", tag, "-m", message])
}

pub fn push_tag(tag: &str) -> Result<()> {
    run_git_no_output(&["push", "origin", tag])
}

#[cfg(test)]
mod tests {
    use super::*;
    use serial_test::serial;
    use std::env;
    use std::fs;
    use std::path::{Path, PathBuf};
    use std::process::Command;
    use tempfile::TempDir;

    struct DirGuard {
        previous: PathBuf,
    }

    impl DirGuard {
        fn change(dir: &Path) -> Self {
            let previous = env::current_dir().expect("current dir");
            env::set_current_dir(dir).expect("set current dir");
            Self { previous }
        }
    }

    impl Drop for DirGuard {
        fn drop(&mut self) {
            let _ = env::set_current_dir(&self.previous);
        }
    }

    fn run_git(dir: &Path, args: &[&str]) -> String {
        let output = Command::new("git")
            .args(args)
            .current_dir(dir)
            .output()
            .expect("run git");
        assert!(
            output.status.success(),
            "git failed: {}",
            String::from_utf8_lossy(&output.stderr)
        );
        String::from_utf8_lossy(&output.stdout).trim().to_string()
    }

    fn init_repo() -> TempDir {
        let dir = TempDir::new().expect("temp dir");
        run_git(dir.path(), &["init"]);
        run_git(dir.path(), &["config", "user.email", "test@example.com"]);
        run_git(dir.path(), &["config", "user.name", "Test User"]);
        fs::write(dir.path().join("README.md"), "hello").expect("write file");
        run_git(dir.path(), &["add", "README.md"]);
        run_git(dir.path(), &["commit", "-m", "init"]);
        dir
    }

    fn add_commit(dir: &Path, message: &str, content: &str) {
        fs::write(dir.join("README.md"), content).expect("write file");
        run_git(dir, &["add", "README.md"]);
        run_git(dir, &["commit", "-m", message]);
    }

    #[test]
    #[serial]
    fn returns_latest_tag() {
        let repo = init_repo();
        let _guard = DirGuard::change(repo.path());

        run_git(repo.path(), &["tag", "-a", "0.1.0", "-m", "v0.1.0"]);
        add_commit(repo.path(), "feat: next", "next");
        run_git(repo.path(), &["tag", "-a", "0.2.0", "-m", "v0.2.0"]);

        let latest = latest_tag().expect("latest tag");
        assert_eq!(latest, "0.2.0");
    }

    #[test]
    #[serial]
    fn reads_remote_origin_url() {
        let repo = init_repo();
        let remote_dir = TempDir::new().expect("remote dir");
        run_git(remote_dir.path(), &["init", "--bare"]);

        run_git(
            repo.path(),
            &["remote", "add", "origin", remote_dir.path().to_str().unwrap()],
        );

        let _guard = DirGuard::change(repo.path());
        let origin = remote_origin_url().expect("origin url");
        assert_eq!(origin, remote_dir.path().to_str().unwrap());
    }

    #[test]
    #[serial]
    fn reads_commit_log_from_revision() {
        let repo = init_repo();
        run_git(repo.path(), &["tag", "-a", "0.1.0", "-m", "v0.1.0"]);
        add_commit(repo.path(), "feat: new", "new");

        let _guard = DirGuard::change(repo.path());
        let log = commit_log_from_revision("0.1.0");
        assert!(log.contains("feat: new"));
    }

    #[test]
    #[serial]
    fn creates_and_pushes_tag() {
        let repo = init_repo();
        let remote_dir = TempDir::new().expect("remote dir");
        run_git(remote_dir.path(), &["init", "--bare"]);
        run_git(
            repo.path(),
            &["remote", "add", "origin", remote_dir.path().to_str().unwrap()],
        );

        let _guard = DirGuard::change(repo.path());
        create_tag("0.3.0", "v0.3.0").expect("create tag");
        push_tag("0.3.0").expect("push tag");

        let refs = run_git(remote_dir.path(), &["show-ref", "--tags"]);
        assert!(refs.contains("refs/tags/0.3.0"));
    }
}
