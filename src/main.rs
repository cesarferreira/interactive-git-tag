use anyhow::{anyhow, Result};
use console::style;
use std::env;
use std::time::Duration;

mod git;
mod pretty_version_diff;
mod release;
mod ui;
mod version;

const NOTES_COMMANDS: [&str; 3] = ["commits", "releasenotes", "notes"];

fn main() {
    if let Err(error) = run() {
        eprintln!("{}", error);
        std::process::exit(1);
    }
}

fn run() -> Result<()> {
    let args: Vec<String> = env::args().skip(1).collect();

    if args.is_empty() {
        return interactive_flow();
    }

    let command = args[0].as_str();

    if command == "help" || command == "--help" || command == "-h" {
        print_usage();
        return Ok(());
    }

    if command == "about" {
        ui::print_about();
        return Ok(());
    }

    if command == "version" || command == "--version" || command == "-v" {
        println!("Current version is {}", style(env!("CARGO_PKG_VERSION")).green());
        return Ok(());
    }

    if version::is_increment(command) {
        return run_increment(command);
    }

    if NOTES_COMMANDS.contains(&command) {
        return run_notes(&args[1..]);
    }

    interactive_flow()
}

fn print_usage() {
    println!(
        "Usage\n\n    $ tag <version>\n\n    Version can be:\n      patch | minor | major | prepatch | preminor | premajor | prerelease\n \n Examples\n\n    $ tag\n    $ tag patch\n    $ tag major\n    $ tag prepatch\n    $ tag premajor\n    $ tag prerelease\n    $ tag notes               # shows the list of commits since the last tag was pushed\n    $ tag commits             # shows the list of commits since the last tag was pushed\n    $ tag notes 0.5.1 1.0.0   # shows the list of commits between 0.5.1 and 1.0.0\n    $ tag notes 0.5.1         # shows the list of commits between 0.5.1 and HEAD\n"
    );
}

fn interactive_flow() -> Result<()> {
    let old_tag = latest_tag_or_default();
    ui::initial_prompt(&old_tag)?;

    let release_notes = get_release_notes(&old_tag, "HEAD")?;

    if release_notes.is_empty() {
        println!("{}", style("No commits since the last tag").yellow().bold());
    } else {
        println!("{}", style("Commits:").white().bold());
    }

    println!("{}", release::strip_compare_link(&release_notes));

    let (new_tag, message) = ui::ask_for_valid_new_tag(&old_tag)?;
    let confirmed = are_you_sure_you_want_to_push(&old_tag, &new_tag, &message)?;

    if confirmed {
        create_release(&old_tag, &new_tag)?;
    }

    Ok(())
}

fn run_increment(increment: &str) -> Result<()> {
    let old_tag = latest_tag_or_default();
    let new_tag = version::get_new_version_from(&old_tag, increment)?;

    println!();
    println!("{}", style("Commits:").white().bold());

    let release_notes = get_release_notes(&old_tag, &new_tag)?;
    println!("{}", release::strip_compare_link(&release_notes));

    let confirmed = are_you_sure_you_want_to_push(&old_tag, &new_tag, &new_tag)?;
    if confirmed {
        create_release(&old_tag, &new_tag)?;
    }

    Ok(())
}

fn run_notes(params: &[String]) -> Result<()> {
    let (from, to) = match params.len() {
        0 => (latest_tag_or_default(), "HEAD".to_string()),
        1 => (params[0].clone(), "HEAD".to_string()),
        _ => (params[0].clone(), params[1].clone()),
    };

    match get_release_notes(&from, &to) {
        Ok(release_notes) => {
            println!();
            if release_notes.is_empty() {
                println!(
                    "{}",
                    style(format!("No commits between {} and {}", from, to))
                        .yellow()
                        .bold()
                );
            } else {
                println!("{}", style("Commits:").white().bold());
                println!("{}", release_notes);
            }
        }
        Err(error) => {
            eprintln!("{}", error);
        }
    }

    Ok(())
}

fn latest_tag_or_default() -> String {
    git::latest_tag().unwrap_or_else(|_| "0.0.0".to_string())
}

fn get_release_notes(old_tag: &str, new_tag: &str) -> Result<String> {
    let remote = git::remote_origin_url()?;
    let repo_url = release::github_repo_url(&remote)
        .ok_or_else(|| anyhow!("Unsupported GitHub remote URL: {}", remote))?;

    let result = release::build_release_notes(&repo_url, old_tag, new_tag);
    Ok(result.release_notes)
}

fn are_you_sure_you_want_to_push(old_tag: &str, new_tag: &str, message: &str) -> Result<bool> {
    let confirmed = ui::ask_for_confirmation(old_tag, new_tag)?;
    println!();

    if !confirmed {
        ui::fails_to_confirm();
        return Ok(false);
    }

    let spinner = indicatif::ProgressBar::new_spinner();
    spinner.enable_steady_tick(Duration::from_millis(100));
    spinner.set_message(format!("Pushing {}", style(new_tag).green().bold()));

    match push_new_tag(new_tag, message) {
        Ok(()) => {
            spinner.finish_with_message(ui::tag_push_success_message(new_tag));
            Ok(true)
        }
        Err(error) => {
            spinner.abandon_with_message(error.to_string());
            Ok(false)
        }
    }
}

fn push_new_tag(new_tag: &str, message: &str) -> Result<()> {
    git::create_tag(new_tag, message)?;
    git::push_tag(new_tag)?;
    Ok(())
}

fn create_release(old_tag: &str, new_tag: &str) -> Result<()> {
    let remote = git::remote_origin_url()?;
    let repo_url = release::github_repo_url(&remote)
        .ok_or_else(|| anyhow!("Unsupported GitHub remote URL: {}", remote))?;

    let release_notes = release::build_release_notes(&repo_url, old_tag, new_tag).release_notes;
    let is_prerelease = version::is_prerelease(new_tag)?;
    release::open_release_draft(&repo_url, new_tag, &release_notes, is_prerelease)
}
