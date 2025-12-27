use anyhow::Result;
use console::style;
use dialoguer::{theme::ColorfulTheme, Confirm, Input, Select};

use crate::pretty_version_diff;
use crate::version;

pub fn ask_for_confirmation(old_version: &str, new_version: &str) -> Result<bool> {
    let prompt = format!(
        "Will bump from {} to {}. Continue?",
        style(old_version).green().bold(),
        style(new_version).green().bold()
    );

    Ok(Confirm::with_theme(&ColorfulTheme::default())
        .with_prompt(prompt)
        .default(true)
        .interact()?)
}

pub fn fails_to_confirm() {
    println!(
        "\n{}\n",
        style("Thanks for wasting my time 😪").yellow().bold()
    );
}

pub fn print_about() {
    println!(
        "\n {} {}",
        style("Made with ❤ by").white().bold(),
        style("http://cesarferreira.com").green().bold()
    );
}

pub fn initial_prompt(latest_tag: &str) -> Result<()> {
    let folder = current_folder_name()?;
    let current_version = format!("(current: {})", latest_tag);

    println!(
        "\nTag a new version of {} {}\n",
        style(folder).magenta().bold(),
        style(current_version).dim()
    );

    Ok(())
}

pub fn tag_push_success_message(new_version: &str) -> String {
    format!(
        "{} {} published 🎉",
        style(current_folder_name().unwrap_or_else(|_| "".to_string()))
            .white()
            .bold(),
        style(new_version).green().bold()
    )
}

pub fn ask_for_valid_new_tag(old_version: &str) -> Result<(String, String)> {
    let theme = ColorfulTheme::default();

    let mut choices = Vec::new();
    for inc in version::SEMVER_INCREMENTS {
        let diff = pretty_version_diff::pretty_version_diff(old_version, inc)?;
        choices.push(format!("{:<10} {}", inc, diff));
    }
    choices.push("Other (specify)".to_string());

    let selection = Select::with_theme(&theme)
        .with_prompt("Select semver increment or specify new version")
        .items(&choices)
        .default(0)
        .interact()?;

    let new_tag = if selection == choices.len() - 1 {
        prompt_for_version(old_version, &theme)?
    } else {
        let inc = version::SEMVER_INCREMENTS[selection];
        version::get_new_version_from(old_version, inc)?
    };

    let message: String = Input::with_theme(&theme)
        .with_prompt("What message should the tag have")
        .with_initial_text(new_tag.clone())
        .interact_text()?;

    Ok((new_tag, message))
}

fn prompt_for_version(old_version: &str, theme: &ColorfulTheme) -> Result<String> {
    let input: String = Input::with_theme(theme)
        .with_prompt("Version")
        .validate_with(|value: &String| -> Result<(), String> {
            if !version::is_valid_input(value) {
                return Err(
                    "Please specify a valid semver, for example, `1.2.3`. See http://semver.org".to_string(),
                );
            }

            let candidate = match version::get_new_version_from(old_version, value) {
                Ok(version) => version,
                Err(_) => {
                    return Err(
                        "Please specify a valid semver, for example, `1.2.3`. See http://semver.org"
                            .to_string(),
                    )
                }
            };

            match version::is_lower_than_or_equal_to(old_version, &candidate) {
                Ok(true) => Err(format!("Version must be greater than {}", old_version)),
                Ok(false) => Ok(()),
                Err(_) => Err(
                    "Please specify a valid semver, for example, `1.2.3`. See http://semver.org"
                        .to_string(),
                ),
            }
        })
        .interact_text()?;

    version::get_new_version_from(old_version, &input)
}

fn current_folder_name() -> Result<String> {
    let path = std::env::current_dir()?;
    let name = path
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("");
    Ok(name.to_string())
}
