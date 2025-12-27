use anyhow::{anyhow, Result};
use semver::{Prerelease, Version};

pub const SEMVER_INCREMENTS: [&str; 7] = [
    "patch",
    "minor",
    "major",
    "prepatch",
    "preminor",
    "premajor",
    "prerelease",
];

pub fn is_increment(input: &str) -> bool {
    SEMVER_INCREMENTS.contains(&input)
}

pub fn is_valid_input(input: &str) -> bool {
    is_increment(input) || parse_version(input).is_ok()
}

pub fn validate(version: &str) -> Result<()> {
    if parse_version(version).is_err() {
        return Err(anyhow!("Version should be a valid semver version."));
    }
    Ok(())
}

pub fn get_new_version_from(old_version: &str, input: &str) -> Result<String> {
    validate(old_version)?;

    if !is_valid_input(input) {
        return Err(anyhow!(
            "Version should be either {} or a valid semver version.",
            SEMVER_INCREMENTS.join(", ")
        ));
    }

    if is_increment(input) {
        let parsed = parse_version(old_version)?;
        let next = increment(parsed, input)?;
        Ok(next.to_string())
    } else {
        Ok(input.to_string())
    }
}

pub fn is_prerelease(version: &str) -> Result<bool> {
    let parsed = parse_version(version)?;
    Ok(!parsed.pre.is_empty())
}

pub fn is_lower_than_or_equal_to(old_version: &str, other: &str) -> Result<bool> {
    let base = parse_version(old_version)?;
    let candidate = parse_version(other)?;
    Ok(candidate <= base)
}

fn normalize_version(input: &str) -> &str {
    input.strip_prefix('v').or_else(|| input.strip_prefix('V')).unwrap_or(input)
}

fn parse_version(input: &str) -> Result<Version> {
    let normalized = normalize_version(input);
    Version::parse(normalized).map_err(|_| anyhow!("Version should be a valid semver version."))
}

fn increment(mut version: Version, inc: &str) -> Result<Version> {
    match inc {
        "patch" => {
            version.patch += 1;
            version.pre = Prerelease::EMPTY;
        }
        "minor" => {
            version.minor += 1;
            version.patch = 0;
            version.pre = Prerelease::EMPTY;
        }
        "major" => {
            version.major += 1;
            version.minor = 0;
            version.patch = 0;
            version.pre = Prerelease::EMPTY;
        }
        "prepatch" => {
            version.patch += 1;
            version.pre = Prerelease::new("0")?;
        }
        "preminor" => {
            version.minor += 1;
            version.patch = 0;
            version.pre = Prerelease::new("0")?;
        }
        "premajor" => {
            version.major += 1;
            version.minor = 0;
            version.patch = 0;
            version.pre = Prerelease::new("0")?;
        }
        "prerelease" => {
            if version.pre.is_empty() {
                version.patch += 1;
                version.pre = Prerelease::new("0")?;
            } else {
                version.pre = increment_pre_release(&version.pre)?;
            }
        }
        _ => {
            return Err(anyhow!(
                "Version should be either {} or a valid semver version.",
                SEMVER_INCREMENTS.join(", ")
            ));
        }
    }

    Ok(version)
}

fn increment_pre_release(pre: &Prerelease) -> Result<Prerelease> {
    let raw = pre.as_str();
    if raw.is_empty() {
        return Ok(Prerelease::new("0")?);
    }

    let mut parts: Vec<String> = raw.split('.').map(|part| part.to_string()).collect();
    for index in (0..parts.len()).rev() {
        if parts[index].chars().all(|ch| ch.is_ascii_digit()) {
            let value: u64 = parts[index].parse().unwrap_or(0);
            parts[index] = (value + 1).to_string();
            return Ok(Prerelease::new(&parts.join("."))?);
        }
    }

    parts.push("0".to_string());
    Ok(Prerelease::new(&parts.join("."))?)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn increment_list_contains_expected_values() {
        assert!(is_increment("patch"));
        assert!(is_increment("minor"));
        assert!(is_increment("major"));
        assert!(is_increment("prepatch"));
        assert!(is_increment("preminor"));
        assert!(is_increment("premajor"));
        assert!(is_increment("prerelease"));
        assert!(!is_increment("foo"));
    }

    #[test]
    fn validates_input_versions() {
        assert!(is_valid_input("1.2.3"));
        assert!(is_valid_input("v1.2.3"));
        assert!(!is_valid_input("1.2"));
        assert!(!is_valid_input("abc"));
    }

    #[test]
    fn increments_semver_versions() {
        assert_eq!(get_new_version_from("1.2.3", "patch").unwrap(), "1.2.4");
        assert_eq!(get_new_version_from("1.2.3", "minor").unwrap(), "1.3.0");
        assert_eq!(get_new_version_from("1.2.3", "major").unwrap(), "2.0.0");
        assert_eq!(get_new_version_from("1.2.3", "prepatch").unwrap(), "1.2.4-0");
        assert_eq!(get_new_version_from("1.2.3", "preminor").unwrap(), "1.3.0-0");
        assert_eq!(get_new_version_from("1.2.3", "premajor").unwrap(), "2.0.0-0");
    }

    #[test]
    fn prerelease_behaves_like_node_semver() {
        assert_eq!(
            get_new_version_from("1.2.3", "prerelease").unwrap(),
            "1.2.4-0"
        );
        assert_eq!(
            get_new_version_from("1.2.3-0", "prerelease").unwrap(),
            "1.2.3-1"
        );
        assert_eq!(
            get_new_version_from("1.2.3-alpha", "prerelease").unwrap(),
            "1.2.3-alpha.0"
        );
    }

    #[test]
    fn accepts_explicit_versions() {
        assert_eq!(get_new_version_from("1.2.3", "1.2.4").unwrap(), "1.2.4");
        assert_eq!(
            get_new_version_from("1.2.3", "v1.2.4").unwrap(),
            "v1.2.4"
        );
    }

    #[test]
    fn rejects_invalid_versions() {
        assert!(get_new_version_from("1.2.3", "nope").is_err());
        assert!(validate("1.2").is_err());
    }

    #[test]
    fn compares_versions_correctly() {
        assert!(is_lower_than_or_equal_to("1.2.3", "1.2.3").unwrap());
        assert!(is_lower_than_or_equal_to("1.2.3", "1.2.2").unwrap());
        assert!(!is_lower_than_or_equal_to("1.2.3", "1.2.4").unwrap());
    }
}
