# Use an official Node runtime as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Install dependencies
# Copy package.json and package-lock.json first to leverage Docker cache
COPY package.json package-lock.json* ./
# Install all dependencies, including devDependencies needed for 'npm run dev'
RUN npm install

# Copy the rest of the application code
COPY . .

# Set environment variable for development
ENV NODE_ENV development

# Expose port 3000 for the Next.js development server
EXPOSE 3000

# Command to run the development server
# Use -H 0.0.0.0 to allow connections from outside the container
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"] 