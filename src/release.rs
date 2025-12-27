use anyhow::Result;
use url::Url;

use crate::git;

pub struct ReleaseNotes {
    pub has_commits: bool,
    pub release_notes: String,
}

pub fn build_release_notes(repo_url: &str, old_tag: &str, new_tag: &str) -> ReleaseNotes {
    let commit_log = git::commit_log_from_revision(old_tag);
    build_release_notes_from_log(repo_url, old_tag, new_tag, &commit_log)
}

pub fn strip_compare_link(release_notes: &str) -> &str {
    match release_notes.rfind('\n') {
        Some(index) => &release_notes[..index],
        None => release_notes,
    }
}

pub fn github_repo_url(remote: &str) -> Option<String> {
    if let Some(without_prefix) = remote.strip_prefix("git@") {
        let mut parts = without_prefix.splitn(2, ':');
        let host = parts.next()?;
        if !host.contains("github") {
            return None;
        }
        let path = parts.next()?;
        let cleaned = trim_git_suffix(path);
        return Some(format!("https://{}/{}", host, cleaned));
    }

    if let Ok(url) = Url::parse(remote) {
        let host = url.host_str()?;
        if !host.contains("github") {
            return None;
        }

        let path = url.path().trim_start_matches('/');
        if path.is_empty() {
            return None;
        }

        return Some(format!("https://{}/{}", host, trim_git_suffix(path)));
    }

    None
}

pub fn open_release_draft(
    repo_url: &str,
    tag: &str,
    body: &str,
    is_prerelease: bool,
) -> Result<()> {
    let url = new_github_release_url(repo_url, tag, body, is_prerelease)?;
    open::that(url)?;
    Ok(())
}

fn new_github_release_url(repo_url: &str, tag: &str, body: &str, is_prerelease: bool) -> Result<String> {
    let mut url = Url::parse(&format!("{}/releases/new", repo_url))?;

    {
        let mut query_pairs = url.query_pairs_mut();
        query_pairs.append_pair("tag", tag);
        query_pairs.append_pair("body", body);
        query_pairs.append_pair("prerelease", if is_prerelease { "true" } else { "false" });
    }

    Ok(url.into())
}

fn trim_git_suffix(path: &str) -> &str {
    path.trim_end_matches('/')
        .trim_end_matches(".git")
        .trim_end_matches('/')
}

fn build_release_notes_from_log(
    repo_url: &str,
    old_tag: &str,
    new_tag: &str,
    commit_log: &str,
) -> ReleaseNotes {
    if commit_log.is_empty() {
        return ReleaseNotes {
            has_commits: false,
            release_notes: String::new(),
        };
    }

    let mut notes = Vec::new();
    for line in commit_log.lines() {
        if let Some((message, commit_id)) = line.rsplit_once(' ') {
            notes.push(format!("- {} {}", commit_id, message));
        }
    }

    let mut release_notes = notes.join("\n");
    release_notes.push_str(&format!(
        "\n\n{}/compare/{}...{}",
        repo_url, old_tag, new_tag
    ));

    ReleaseNotes {
        has_commits: true,
        release_notes,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_github_repo_url_formats() {
        assert_eq!(
            github_repo_url("git@github.com:owner/repo.git").unwrap(),
            "https://github.com/owner/repo"
        );
        assert_eq!(
            github_repo_url("https://github.com/owner/repo.git").unwrap(),
            "https://github.com/owner/repo"
        );
        assert!(github_repo_url("git@bitbucket.org:owner/repo.git").is_none());
        assert!(github_repo_url("https://example.com/owner/repo").is_none());
    }

    #[test]
    fn trims_compare_link_for_terminal_output() {
        let notes = "- abcd123 msg\n\nhttps://github.com/owner/repo/compare/1.0.0...1.1.0";
        assert_eq!(strip_compare_link(notes), "- abcd123 msg\n");
    }

    #[test]
    fn builds_release_notes_from_log() {
        let commit_log = "feat: thing abc123\nfix: stuff def456";
        let output = build_release_notes_from_log(
            "https://github.com/owner/repo",
            "1.0.0",
            "1.1.0",
            commit_log,
        );
        assert!(output.has_commits);
        assert!(output.release_notes.contains("- abc123 feat: thing"));
        assert!(output.release_notes.contains("- def456 fix: stuff"));
        assert!(output
            .release_notes
            .contains("https://github.com/owner/repo/compare/1.0.0...1.1.0"));
    }

    #[test]
    fn builds_release_url_with_query_params() {
        let url = new_github_release_url(
            "https://github.com/owner/repo",
            "1.2.3",
            "Body text",
            true,
        )
        .unwrap();

        let parsed = Url::parse(&url).unwrap();
        let params: std::collections::HashMap<_, _> = parsed.query_pairs().into_owned().collect();
        assert_eq!(params.get("tag").unwrap(), "1.2.3");
        assert_eq!(params.get("body").unwrap(), "Body text");
        assert_eq!(params.get("prerelease").unwrap(), "true");
    }
}
