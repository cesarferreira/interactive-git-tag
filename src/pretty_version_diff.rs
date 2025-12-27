use console::style;

use crate::version;

pub fn pretty_version_diff(old_version: &str, inc: &str) -> anyhow::Result<String> {
    let new_version = version::get_new_version_from(old_version, inc)?;
    let new_parts: Vec<&str> = new_version.split('.').collect();
    let old_parts: Vec<&str> = old_version.split('.').collect();

    let mut first_change = false;
    let mut output = Vec::new();

    for (index, new_part) in new_parts.iter().enumerate() {
        let old_part = old_parts.get(index).copied().unwrap_or("");

        if *new_part != old_part && !first_change {
            output.push(style(*new_part).cyan().dim().to_string());
            first_change = true;
        } else if new_part.contains('-') {
            output.push(style(*new_part).cyan().dim().to_string());
        } else {
            output.push(style(*new_part).dim().to_string());
        }
    }

    let dim_dot = style(".").dim().to_string();
    Ok(output.join(&dim_dot))
}

#[cfg(test)]
mod tests {
    use super::*;
    use console::strip_ansi_codes;

    #[test]
    fn renders_version_with_expected_value() {
        let output = pretty_version_diff("1.2.3", "minor").unwrap();
        let stripped = strip_ansi_codes(&output);
        assert_eq!(stripped, "1.3.0");
    }
}
