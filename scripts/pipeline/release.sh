bucket_name=$1
aws_key=$2
aws_access_key=$3
aws_access_secret=$4
local_path=$5

# Remove any existing versions of a ZIP
rm -rf $local_path

# Create a zip of the current directory.
zip -r $local_path . -x "*.git/" -x ".git/**" -x "*.github/" -x ".github/**" -x "*src/" -x "src/**" -x "*.idea/" -x ".idea/**" -x "*.vscode/" -x ".vscode/**" -x "*types/" -x "types/**" -x "*test/" -x "test/**" -x "*.eslintrc.js/" -x ".eslintrc.js/**" -x "*node_modules/" -x "node_modules/**" -x "*.prettierrc/" -x ".prettierrc/**" -x "*nest-cli.json/" -x "nest-cli.json/**" -x "*README.md/" -x "README.md/**" -x "*tsconfig.build.json/" -x "tsconfig.build.json/**" -x "*tsconfig.json/" -x "tsconfig.json/**" -x "*yarn.lock/" -x "yarn.lock/**"

# Install required dependencies for Python script.
pip3 install boto3

# Run upload script
python3 scripts/pipeline/upload_file_to_s3.py $bucket_name $aws_key $aws_access_key $aws_access_secret $local_path