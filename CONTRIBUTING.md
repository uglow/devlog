# Contributing

Welcome! This document explains how you can contribute to making **devlog** even better.


# Getting Started

## Installation

```
git clone <this repo>
npm install -g commitizen
npx husky-init
npm install
```

# Testing

## Unit testing

Command | Description
:------ | :----------
<pre>npm test</pre> | Alias for `npm run test:unit` task
<pre>npm run test:unit</pre> | Run unit tests whenever JS source or tests change. Runs in watch mode.
<pre>npm run test:coverage</pre> | Run unit tests then verify coverage meets defined thresholds.

## Testing the CLI

The `bin/cli.js` file can be tested from the command line by typing `./bin/cli.js`, and passing
any arguments to the command (see [README.md](README.md) for the list of commands).

## Testing via `npm link`

1. Ensure you do not have a globally-installed `devlog` instance. (E.g. Typing `devlog` in your terminal shouldn't do anything)
1. From the devlog-repo-directory, run `npm link`
1. Verify that the command has been installed globally by:
  1. Change to a different directory
  1. Run `devlog`

```shell



```


## Verification (Linting) Tasks

Command | Description
:------ | :----------
<pre>npm run lint</pre> | Lint code style and syntax (and fix errors that can be fixed)
<pre>npm run verify</pre> | Check code style and syntax

## Commit Tasks

Command | Description
:------ | :----------
<pre>git status</pre> | Lists the current branch and the status of changed files
<pre>git log</pre> | Displays the commit log (press Q to quit viewing)
<pre>git add .</pre> | Stages all modified & untracked files, ready to be committed
<pre>git cz</pre> | Commit changes to local repository using Commitizen<ul><li>Asks questions about the change to generate a valid conventional commit message</li><li>Can be customised by modifying [config/release/commitMessageConfig.js](config/release/commitMessageConfig.js)</li></ul>
<pre>git push</pre> | Push local repository changes to remote repository






# GitFlow Development Process

This project uses the [GitHub Flow](https://guides.github.com/introduction/flow/index.html) workflow.

## Create a branch
When you're working on a project, you're going to have a bunch of different features or ideas in progress at any given time – some of which are ready to go, and others which are not. Branching exists to help you manage this workflow.

When you create a branch in your project, you're creating an environment where you can try out new ideas. Changes you make on a branch don't affect the `master` branch, so you're free to experiment and commit changes, safe in the knowledge that your branch won't be merged until it's ready to be reviewed by someone you're collaborating with.

###ProTip

Branching is a core concept in Git, and the entire GitHub Flow is based upon it. There's only one rule: anything in the `master` branch is always deployable.

Because of this, it's extremely important that your new branch is created off of `master` when working on a feature or a fix. Your branch name should be descriptive (e.g., `refactor-authentication`, `user-content-cache-key`, `make-retina-avatars`), so that others can see what is being worked on.

## Add commits
Once your branch has been created, it's time to start making changes. Whenever you add, edit, or delete a file, you're making a commit, and adding them to your branch. This process of adding commits keeps track of your progress as you work on a feature branch.

Commits also create a transparent history of your work that others can follow to understand what you've done and why. Each commit has an associated commit message, which is a description explaining why a particular change was made. Furthermore, each commit is considered a separate unit of change. This lets you roll back changes if a bug is found, or if you decide to head in a different direction.

###ProTip

Commit messages are important, especially since Git tracks your changes and then displays them as commits once they're pushed to the server. By writing clear commit messages, you can make it easier for other people to follow along and provide feedback.

## Open a pull request

Pull Requests initiate discussion about your commits. Because they're tightly integrated with the underlying Git repository, anyone can see exactly what changes would be merged if they accept your request.

You can open a Pull Request at any point during the development process: when you have little or no code but want to share some screenshots or general ideas, when you're stuck and need help or advice, or when you're ready for someone to review your work. By using GitHub's @mention system in your Pull Request message, you can ask for feedback from specific people or teams, whether they're down the hall or ten time zones away.

###ProTip

Pull Requests are useful for contributing to open source projects and for managing changes to shared repositories. If you're using a Fork & Pull Model, Pull Requests provide a way to notify project maintainers about the changes you'd like them to consider. If you're using a Shared Repository Model, Pull Requests help start code review and conversation about proposed changes before they're merged into the `master` branch.

## Discuss and review your code
Once a Pull Request has been opened, the person or team reviewing your changes may have questions or comments. Perhaps the coding style doesn't match project guidelines, the change is missing unit tests, or maybe everything looks great and props are in order. Pull Requests are designed to encourage and capture this type of conversation.

You can also continue to push to your branch in light of discussion and feedback about your commits. If someone comments that you forgot to do something or if there is a bug in the code, you can fix it in your branch and push up the change. GitHub will show your new commits and any additional feedback you may receive in the unified Pull Request view.

###ProTip

Pull Request comments are written in Markdown, so you can embed images and emoji, use pre-formatted text blocks, and other lightweight formatting.

## Merge to `master`

Once your PR has passed any the integration tests and received approval to merge, it is time to merge your code into the `master` branch.

Once merged, Pull Requests preserve a record of the historical changes to your code. Because they're searchable, they let anyone go back in time to understand why and how a decision was made.

###ProTip

By incorporating certain keywords into the text of your Pull Request, you can associate issues with code. When your Pull Request is merged, the related issues are also closed. For example, entering the phrase Closes #32 would close issue number 32 in the repository. For more information, check out our help article.



