#!/bin/bash

# Fancy menu function
# https://unix.stackexchange.com/questions/146570/arrow-key-enter-menu
function select_option() {

    # little helpers for terminal print control and key input
    ESC=$(printf "\033")
    cursor_blink_on() { printf "$ESC[?25h"; }
    cursor_blink_off() { printf "$ESC[?25l"; }
    cursor_to() { printf "$ESC[$1;${2:-1}H"; }
    print_option() { printf "   $1 "; }
    print_selected() { printf "  $ESC[7m $1 $ESC[27m"; }
    get_cursor_row() {
        IFS=';' read -sdR -p $'\E[6n' ROW COL
        echo ${ROW#*[}
    }
    key_input() {
        read -s -n3 key 2>/dev/null >&2
        if [[ $key = $ESC[A ]]; then echo up; fi
        if [[ $key = $ESC[B ]]; then echo down; fi
        if [[ $key = "" ]]; then echo enter; fi
    }

    # initially print empty new lines (scroll down if at bottom of screen)
    for opt; do printf "\n"; done

    # determine current screen position for overwriting the options
    local lastrow=$(get_cursor_row)
    local startrow=$(($lastrow - $#))

    # ensure cursor and input echoing back on upon a ctrl+c during read -s
    trap "cursor_blink_on; stty echo; printf '\n'; exit" 2
    cursor_blink_off

    local selected=0
    while true; do
        # print options by overwriting the last lines
        local idx=0
        for opt; do
            cursor_to $(($startrow + $idx))
            if [ $idx -eq $selected ]; then
                print_selected "$opt"
            else
                print_option "$opt"
            fi
            ((idx++))
        done

        # user key control
        case $(key_input) in
        enter) break ;;
        up)
            ((selected--))
            if [ $selected -lt 0 ]; then selected=$(($# - 1)); fi
            ;;
        down)
            ((selected++))
            if [ $selected -ge $# ]; then selected=0; fi
            ;;
        esac
    done

    # cursor position back to normal
    cursor_to $lastrow
    printf "\n"
    cursor_blink_on

    return $selected
}

function message_abort() {
    echo -e "${RED}Aborting: $1"
    exit 1
}

function message_success() {
    echo -e "${GREEN}$1${NC}"
    echo
}

function message_option() {
    echo -e "$1 ${YELLOW}[$2]${NC}:"
}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Global variables
install_path="/opt/Steve"
config_file="$install_path/.env"

# Exit if not executing in root
if [[ $EUID -ne 0 ]]; then
    message_abort "* This script must be executed with root privileges (sudo)." 1>&2
fi

# Options
echo -e "Setup script for the Steve Discord Bot.  Select an option using arrow keys and enter to confirm:\n"
options=("1. Install - Use this if you have never installed Steve." "2. Reconfigure - Use this if you wish to reconfigure settings.")
select_option "${options[@]}"
choice=$?
if [ $choice -eq 0 ]; then # Install from scratch
    # Check if folder already exists
    cd /opt/
    [ -d "$install_path" ] && message_abort "Could not clone repository, directory '$install_path' already exists."

    # Install dependencies
    apt update && apt install mariadb-server nodejs npm -y

    # Clone repository and install modules
    git clone https://github.com/nathanlytang/Steve.git
    cd Steve
    npm install

    # Set variables
    DB_HOST='127.0.0.1'
    DB_PORT='3306'
    DB_DATABASE='stevebot'
    DB_USERNAME='stevebotuser'
    DB_PASSWORD=''

elif [ $choice -eq 1 ]; then # Reconfigure
    # Check if folder already exists
    [ ! -d "$install_path" ] && message_abort "Installation of Steve Discord Bot could not be found."
    cd $install_path

    # Get environment variables
    set -o allexport
    source $config_file
    set +o allexport

fi

# Configure MariaDB/MySQL
echo "Logging into MySQL with root"
read -s -p "Enter MySQL root password: " mysql_password

# Test connection to database
while ! mysql --user=root --password=$mysql_password -e ";"; do
    read -s -p "Can't connect, please retry: " mysql_password
done
message_success "\nMySQL login successful."

# Database
if [ $choice -eq 0 ]; then
    echo "Creating a new database..."
fi
message_option "Database host" "$DB_HOST"
read -p "> " NEW_DB_HOST && echo
NEW_DB_HOST=${NEW_DB_HOST:="$DB_HOST"}
message_option "Database port" "$DB_PORT"
read -p "> " NEW_DB_PORT && echo
NEW_DB_PORT=${NEW_DB_PORT:="$DB_PORT"}
message_option "Database name" "$DB_DATABASE"
read -p "> " NEW_DB_DATABASE && echo
NEW_DB_DATABASE=${NEW_DB_DATABASE:="$DB_DATABASE"}

# Create database only on installation
if [ "$NEW_DB_PASSWORD" == "$DB_PASSWORD" ] && [ $choice -eq 0 ]; then
    mysql --user=root --password=$mysql_password -e "CREATE DATABASE $NEW_DB_DATABASE;"
    if [ $(echo $?) != 0 ]; then
        # If not successful
        message_abort "Failed to create new database."
        exit 1
    fi
    message_success "New database '$NEW_DB_DATABASE' successfully created."
fi

# Database user
if [ $choice -eq 0 ]; then
    echo "Creating a new database user..."
fi

# Get username
message_option "Enter a username for the database user" "$DB_USERNAME"
read -p "> " NEW_DB_USERNAME && echo
NEW_DB_USERNAME=${NEW_DB_USERNAME:="$DB_USERNAME"}

# Check if username changed
if [ "$NEW_DB_USERNAME" != "$DB_USERNAME" ] && [ $choice -eq 1 ]; then
    # Change username
    mysql --user=root --password=$mysql_password -e "USE mysql; RENAME USER '$DB_USERNAME'@'$DB_HOST' TO '$NEW_DB_USERNAME'@'$DB_HOST';"

    # Check if successful
    if [ $(echo $?) == 0 ]; then
        message_success "Username successfully updated."
    else
        message_abort "Unable to update username."
    fi
    DB_USERNAME=$NEW_DB_USERNAME
fi

# Get password
message_option "Enter a unique password for the database user" "$DB_PASSWORD"
read -p "> " NEW_DB_PASSWORD && echo
NEW_DB_PASSWORD=${NEW_DB_PASSWORD:="$DB_PASSWORD"}

# Check if password changed
if [ "$NEW_DB_PASSWORD" != "$DB_PASSWORD" ] && [ $choice -eq 1 ]; then
    # Change password
    mysql --user=root --password=$mysql_password -e "USE mysql; ALTER USER '$DB_USERNAME'@'$DB_HOST' IDENTIFIED BY '$NEW_DB_PASSWORD'; FLUSH PRIVILEGES;"

    # Check if successful
    if [ $(echo $?) == 0 ]; then
        message_success "Password successfully updated."
    else
        message_abort "Unable to update password."
    fi
    DB_PASSWORD=$NEW_DB_PASSWORD
fi

# Set username and password if installing
if [ $choice -eq 0 ]; then
    mysql --user=root --password=$mysql_password -e "USE mysql; CREATE USER '$NEW_DB_USERNAME'@'127.0.0.1' IDENTIFIED BY '$NEW_DB_PASSWORD';"

    # Check if successful
    if [ $(echo $?) == 0 ]; then
        message_success "New user '$NEW_DB_USERNAME' successfully created."
    else
        message_abort "Failed to create new user."
    fi
fi

# Assign permissions to user
if [ $choice -eq 0 ]; then
    echo "Assigning database permissions to user..."
    mysql --user=root --password=$mysql_password -e "USE mysql; GRANT ALL PRIVILEGES ON $NEW_DB_DATABASE.* TO '$NEW_DB_USERNAME'@'127.0.0.1' WITH GRANT OPTION; FLUSH PRIVILEGES;"

    # Check if successful
    if [ $(echo $?) == 0 ]; then
        message_success "Permissions successfully granted to user '$NEW_DB_USERNAME' on database '$NEW_DB_DATABASE'."
    else
        message_abort "Failed to grant permissions to user '$NEW_DB_USERNAME' on database '$NEW_DB_DATABASE'."
    fi
fi

# Get Discord Token
message_option "Discord token" "$DISCORD_TOKEN"
read -p "> " NEW_DISCORD_TOKEN && echo
NEW_DISCORD_TOKEN=${NEW_DISCORD_TOKEN:="$DISCORD_TOKEN"}

# Write variables to .env
echo -e "Updating environment variables configuration..."

# Empty existing file and rewrite contents
true >$config_file
echo "DISCORD_TOKEN=$NEW_DISCORD_TOKEN" >>$config_file
echo "DB_HOST=$NEW_DB_HOST" >>$config_file
echo "DB_PORT=$NEW_DB_PORT" >>$config_file
echo "DB_DATABASE=$NEW_DB_DATABASE" >>$config_file
echo "DB_USERNAME=$NEW_DB_USERNAME" >>$config_file
echo "DB_PASSWORD=$NEW_DB_PASSWORD" >>$config_file
if [ $(echo $?) == 0 ]; then
    message_success "Configuration successfully updated."
fi

echo "Exiting setup program."
exit 0
